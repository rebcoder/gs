package in.rebcoder.gs_back.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.cache.CacheProperties;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

/**
 * Spring Boot's default Redis cache value serializer is JDK serialization
 * ({@code JdkSerializationRedisSerializer}), which requires every cached return type to implement
 * {@link java.io.Serializable}. Our cached service methods (e.g. GarageSaleServiceImpl's @Cacheable
 * methods) return DTOs that don't, so every cached endpoint threw a 500
 * (java.io.NotSerializableException) as soon as it ran against real Redis - invisible in unit/
 * @WebMvcTest runs, which mock the service layer and never touch a real cache.
 * <p>
 * Switch to JSON serialization instead, which works for any POJO with a default constructor and
 * getters/setters (no Serializable requirement), while preserving the TTL / null-value / key-prefix
 * behavior already configured under {@code spring.cache.redis.*} in application.yml.
 * <p>
 * IMPORTANT: {@link GenericJackson2JsonRedisSerializer}'s no-arg constructor activates Jackson
 * "default typing" (embeds an {@code @class} field in the JSON) so a cache <em>read</em> can
 * reconstruct the original DTO type - without it, a cache hit deserializes into a generic
 * {@code LinkedHashMap} instead of e.g. {@code GarageSaleDto}, and the calling code's cast throws
 * {@code ClassCastException} (this bit us: the very first request after a cache-config change always
 * looked fine because it was a cache *miss* computed fresh; only a second request within the TTL,
 * hitting the cache, actually exercised deserialization and failed). Since we supply our own
 * {@link ObjectMapper} (to register {@link JavaTimeModule}), we must activate default typing on it
 * ourselves too - the constructor's version is not applied when a custom mapper is passed in.
 */
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer(CacheProperties cacheProperties) {
        CacheProperties.Redis redisProps = cacheProperties.getRedis();

        // GenericJackson2JsonRedisSerializer's no-arg constructor does not register the JSR-310
        // module, so java.time types (LocalDate/LocalTime on our DTOs) fail to serialize - build our
        // own ObjectMapper with it registered instead of relying on the default. We then have to
        // replicate the default constructor's type-preserving config ourselves too (see class javadoc).
        ObjectMapper cacheObjectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        cacheObjectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY);

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer(cacheObjectMapper)));

        if (redisProps.getTimeToLive() != null) {
            config = config.entryTtl(redisProps.getTimeToLive());
        }
        if (!redisProps.isCacheNullValues()) {
            config = config.disableCachingNullValues();
        }
        if (redisProps.getKeyPrefix() != null) {
            config = config.prefixCacheNameWith(redisProps.getKeyPrefix());
        }
        if (!redisProps.isUseKeyPrefix()) {
            config = config.disableKeyPrefix();
        }

        RedisCacheConfiguration finalConfig = config;
        return builder -> builder.cacheDefaults(finalConfig);
    }
}
