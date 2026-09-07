package in.rebcoder.gs_back.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.rebcoder.gs_back.exception.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.requests-per-minute:120}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.cleanup-interval-ms:60000}")
    private long cleanupIntervalMs;

    private volatile long lastCleanupEpochMs = System.currentTimeMillis();

    public RateLimitingFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        maybeCleanup(now);

        String clientKey = resolveClientKey(request);
        WindowCounter counter = counters.computeIfAbsent(clientKey, key -> new WindowCounter(now));

        boolean allowed;
        synchronized (counter) {
            if (now - counter.windowStartMs >= 60_000L) {
                counter.windowStartMs = now;
                counter.requestCount.set(0);
            }
            allowed = counter.requestCount.incrementAndGet() <= requestsPerMinute;
        }

        if (!allowed) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", "60");

            ApiErrorResponse error = ApiErrorResponse.builder()
                    .timestamp(Instant.now())
                    .status(429)
                    .error("Too Many Requests")
                    .message("Rate limit exceeded. Please retry later.")
                    .path(request.getRequestURI())
                    .requestId((String) request.getAttribute("requestId"))
                    .validationErrors(null)
                    .build();
            objectMapper.writeValue(response.getWriter(), error);
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/h2-console")
                || path.startsWith("/uploads")
                || "/api/test/health".equals(path);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    private void maybeCleanup(long now) {
        if (now - lastCleanupEpochMs < cleanupIntervalMs) {
            return;
        }
        lastCleanupEpochMs = now;
        counters.entrySet().removeIf(entry -> now - entry.getValue().windowStartMs > 5 * 60_000L);
    }

    private static final class WindowCounter {
        private volatile long windowStartMs;
        private final AtomicInteger requestCount = new AtomicInteger(0);

        private WindowCounter(long windowStartMs) {
            this.windowStartMs = windowStartMs;
        }
    }
}
