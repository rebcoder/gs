package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.dtos.GarageSaleDto;
import in.rebcoder.gs_back.dtos.ItemDto;
import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.exception.UnauthorizedAccessException;
import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.repositories.SaleRepository;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.repositories.HomeRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GarageSaleServiceImpl implements GarageSaleService {

    private static final Logger log = LoggerFactory.getLogger(GarageSaleServiceImpl.class);

    private final SaleRepository saleRepository;
    private final HomeRepository homeRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final in.rebcoder.gs_back.repositories.ItemRepository itemRepository;

    @Override
    @Cacheable(cacheNames = "garageSales", key = "{#city,#area,#latitude,#longitude,#radiusKm,#category,#status}")
    public List<GarageSaleDto> searchGarageSales(String city, String area, Double latitude, Double longitude,
                                                 Integer radiusKm, String category, String status) {
        try {
            List<Sale> sales = saleRepository.findAll();
            log.debug("Found {} sales in database", sales.size());
            List<GarageSaleDto> dtos = sales.stream().map(this::toDto).collect(Collectors.toList());
            log.debug("Converted to {} DTOs", dtos.size());
            return dtos;
        } catch (Exception e) {
            log.error("Error in searchGarageSales: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Cacheable(cacheNames = "garageSalesSearch", key = "#query == null ? '' : #query.toLowerCase()")
    public List<GarageSaleDto> searchGarageSalesByQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return searchGarageSales(null, null, null, null, null, null, null);
        }

        String needle = query.toLowerCase(Locale.ROOT).trim();
        return saleRepository.findAll().stream()
                .map(this::toDto)
                .filter(dto -> matchesQuery(dto, needle))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = "garageSalesFeatured", key = "'all'")
    public List<GarageSaleDto> getFeaturedGarageSales() {
        List<GarageSaleDto> featured = saleRepository.findAll().stream()
                .filter(Sale::isFeatured)
                .map(this::toDto)
                .collect(Collectors.toList());

        if (!featured.isEmpty()) {
            return featured;
        }

        // Fallback for empty data: show latest 3 sales so homepage isn't blank.
        return saleRepository.findAll().stream()
                .sorted(Comparator.comparing(Sale::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(3)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(cacheNames = "garageSaleById", key = "#id")
    public GarageSaleDto getGarageSaleById(Long id) {
        try {
            log.debug("Looking for sale with ID: {}", id);
            Sale sale = saleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
            log.debug("Found sale: {}", sale.getSaleName());
            GarageSaleDto dto = toDto(sale);
            log.debug("Converted to DTO: {}", dto.getSaleName());
            return dto;
        } catch (Exception e) {
            log.error("Error in getGarageSaleById: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "garageSales", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesNearby", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesSearch", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesFeatured", allEntries = true)
    })
    public GarageSaleDto createGarageSale(GarageSaleDto garageSaleDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            throw new UnauthorizedAccessException("Authentication required to create a sale");
        }
        String username = authentication.getName();

        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Home home = resolveSellerHome(user, garageSaleDto);

        Sale sale = new Sale();
        sale.setSaleName(garageSaleDto.getSaleName());
        sale.setDescription(garageSaleDto.getDescription());
        sale.setSaleDate(garageSaleDto.getSaleDate() != null ? garageSaleDto.getSaleDate() : LocalDate.now());
        sale.setStartTime(garageSaleDto.getStartTime() != null ? garageSaleDto.getStartTime() : LocalTime.of(9, 0));
        sale.setEndTime(garageSaleDto.getEndTime() != null ? garageSaleDto.getEndTime() : LocalTime.of(17, 0));
        sale.setArea(garageSaleDto.getArea() != null ? garageSaleDto.getArea() : home.getArea());
        sale.setCity(garageSaleDto.getCity() != null ? garageSaleDto.getCity() : home.getCity());
        sale.setLatitude(garageSaleDto.getLatitude() != null ? garageSaleDto.getLatitude() : home.getLatitude());
        sale.setLongitude(garageSaleDto.getLongitude() != null ? garageSaleDto.getLongitude() : home.getLongitude());
        sale.setFeatured(Boolean.TRUE.equals(garageSaleDto.getFeatured()));
        int maxPerSlot = garageSaleDto.getMaxAppointmentsPerSlot() != null ? garageSaleDto.getMaxAppointmentsPerSlot() : 3;
        sale.setMaxAppointmentsPerSlot(Math.max(1, maxPerSlot));
        sale.setSeller(user);
        sale.setHome(home);

        sale = saleRepository.save(sale);
        return toDto(sale);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "garageSaleById", key = "#id"),
            @CacheEvict(cacheNames = "garageSales", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesNearby", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesSearch", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesFeatured", allEntries = true)
    })
    public GarageSaleDto updateGarageSale(Long id, GarageSaleDto garageSaleDto) {
        Sale sale = saleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        sale.setSaleName(garageSaleDto.getSaleName());
        sale.setDescription(garageSaleDto.getDescription());
        if (garageSaleDto.getSaleDate() != null) sale.setSaleDate(garageSaleDto.getSaleDate());
        if (garageSaleDto.getStartTime() != null) sale.setStartTime(garageSaleDto.getStartTime());
        if (garageSaleDto.getEndTime() != null) sale.setEndTime(garageSaleDto.getEndTime());
        sale.setArea(garageSaleDto.getArea());
        sale.setCity(garageSaleDto.getCity());
        if (garageSaleDto.getFeatured() != null) {
            sale.setFeatured(garageSaleDto.getFeatured());
        }
        if (garageSaleDto.getMaxAppointmentsPerSlot() != null) {
            sale.setMaxAppointmentsPerSlot(garageSaleDto.getMaxAppointmentsPerSlot());
        }
        sale = saleRepository.save(sale);
        return toDto(sale);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "garageSaleById", key = "#id"),
            @CacheEvict(cacheNames = "garageSales", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesNearby", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesSearch", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesFeatured", allEntries = true)
    })
    public void deleteGarageSale(Long id) {
        saleRepository.deleteById(id);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "garageSaleById", key = "#id"),
            @CacheEvict(cacheNames = "garageSales", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesNearby", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesSearch", allEntries = true),
            @CacheEvict(cacheNames = "garageSalesFeatured", allEntries = true)
    })
    public void deleteGarageSale(Long id, String username) {
        Sale sale = saleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        var user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (sale.getSeller() == null || !sale.getSeller().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("Only the sale owner can delete this sale");
        }

        // Appointments reference sale via FK, so remove them first.
        var appointments = appointmentRepository.findBySaleId(sale.getId());
        if (!appointments.isEmpty()) {
            appointmentRepository.deleteAll(appointments);
        }
        saleRepository.delete(sale);
    }

    @Override
    public List<GarageSaleDto> getGarageSalesBySeller(String username) {
        var user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return saleRepository.findBySeller(user).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public ItemDto addItemToGarageSale(Long saleId, ItemDto itemDto) {
        // Basic add: create Item entity and associate with sale/home
        in.rebcoder.gs_back.models.Item item = new in.rebcoder.gs_back.models.Item();
        item.setName(itemDto.getName());
        item.setDescription(itemDto.getDescription());
        item.setPrice(itemDto.getPrice());
        item.setImageUrl(itemDto.getImageUrl());
        if (itemDto.getCategory() != null) {
            try {
                item.setCategory(in.rebcoder.gs_back.models.ItemCategory.valueOf(itemDto.getCategory()));
            } catch (Exception ignored) {}
        }
        // associate sale
        Sale sale = saleRepository.findById(saleId).orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        item.setSale(sale);
        // associate home if provided
        if (itemDto.getHomeId() != null) {
            homeRepository.findById(itemDto.getHomeId()).ifPresent(item::setHome);
        }
        in.rebcoder.gs_back.repositories.ItemRepository repo = (in.rebcoder.gs_back.repositories.ItemRepository) itemRepository;
        repo.save(item);
        itemDto.setId(item.getId());
        itemDto.setImageUrl(item.getImageUrl());
        return itemDto;
    }

    @Override
    public ItemDto updateItem(Long saleId, Long itemId, ItemDto itemDto) {
        in.rebcoder.gs_back.models.Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        if (saleId != null) {
            Sale sale = saleRepository.findById(saleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
            item.setSale(sale);
        }
        if (itemDto.getName() != null) item.setName(itemDto.getName());
        if (itemDto.getDescription() != null) item.setDescription(itemDto.getDescription());
        if (itemDto.getPrice() != null) item.setPrice(itemDto.getPrice());
        if (itemDto.getImageUrl() != null) item.setImageUrl(itemDto.getImageUrl());
        if (itemDto.getCategory() != null) {
            try { item.setCategory(in.rebcoder.gs_back.models.ItemCategory.valueOf(itemDto.getCategory())); } catch (Exception ignored) {}
        }
        item.setAvailable(itemDto.isAvailable());
        item.setSold(itemDto.isSold());

        itemRepository.save(item);
        itemDto.setId(item.getId());
        itemDto.setImageUrl(item.getImageUrl());
        itemDto.setSaleId(item.getSale() != null ? item.getSale().getId() : null);
        return itemDto;
    }

    @Override
    public void removeItemFromGarageSale(Long saleId, Long itemId) {
        in.rebcoder.gs_back.models.Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        if (saleId != null && item.getSale() != null && !item.getSale().getId().equals(saleId)) {
            throw new IllegalArgumentException("Item does not belong to the provided sale");
        }
        itemRepository.delete(item);
    }

    @Override
    public List<AppointmentDto> getGarageSaleAppointments(Long saleId) {
        return List.of();
    }

    @Override
    @Cacheable(cacheNames = "garageSalesNearby", key = "{#latitude,#longitude,#radiusKm}")
    public List<GarageSaleDto> getNearbyGarageSales(Double latitude, Double longitude, Integer radiusKm) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        int safeRadiusKm = radiusKm == null ? 10 : Math.max(1, radiusKm);

        return saleRepository.findAll().stream()
                .filter(sale -> sale.getLatitude() != null && sale.getLongitude() != null)
                .filter(sale -> haversineDistanceKm(latitude, longitude, sale.getLatitude(), sale.getLongitude()) <= safeRadiusKm)
                .sorted(Comparator.comparingDouble(sale -> haversineDistanceKm(
                        latitude, longitude, sale.getLatitude(), sale.getLongitude()
                )))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private double haversineDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        final double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private Home resolveSellerHome(in.rebcoder.gs_back.models.User user, GarageSaleDto garageSaleDto) {
        if (garageSaleDto.getHomeId() != null) {
            Home home = homeRepository.findById(garageSaleDto.getHomeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Home not found"));
            if (home.getSeller() == null || !home.getSeller().getId().equals(user.getId())) {
                throw new UnauthorizedAccessException("Cannot create sale under a different seller home");
            }
            return home;
        }

        Home home = homeRepository.findBySeller(user).orElseGet(() -> {
            Home created = new Home();
            created.setSeller(user);
            return created;
        });
        home.setAddress(home.getAddress() != null ? home.getAddress() : "Shared after confirmation");
        home.setArea(garageSaleDto.getArea() != null ? garageSaleDto.getArea() : (home.getArea() != null ? home.getArea() : "Unknown Area"));
        home.setCity(garageSaleDto.getCity() != null ? garageSaleDto.getCity() : (home.getCity() != null ? home.getCity() : "Unknown City"));
        home.setLatitude(garageSaleDto.getLatitude() != null ? garageSaleDto.getLatitude() : home.getLatitude());
        home.setLongitude(garageSaleDto.getLongitude() != null ? garageSaleDto.getLongitude() : home.getLongitude());
        return homeRepository.save(home);
    }

    private GarageSaleDto toDto(Sale sale) {
        GarageSaleDto dto = new GarageSaleDto();
        dto.setId(sale.getId());
        dto.setSaleName(sale.getSaleName());
        dto.setDescription(sale.getDescription());
        dto.setSaleDate(sale.getSaleDate());
        dto.setStartTime(sale.getStartTime());
        dto.setEndTime(sale.getEndTime());
        dto.setArea(sale.getArea());
        dto.setCity(sale.getCity());
        dto.setLatitude(sale.getLatitude());
        dto.setLongitude(sale.getLongitude());
        dto.setFeatured(sale.isFeatured());
        dto.setMaxAppointmentsPerSlot(sale.getMaxAppointmentsPerSlot());
        dto.setSellerId(sale.getSeller() != null ? sale.getSeller().getId() : null);
        dto.setHomeId(sale.getHome() != null ? sale.getHome().getId() : null);
        // Populate items for the sale
        List<in.rebcoder.gs_back.models.Item> items = itemRepository.findBySaleId(sale.getId());
        if (items != null && !items.isEmpty()) {
            dto.setItems(items.stream().map(it -> {
                in.rebcoder.gs_back.dtos.ItemDto idto = new in.rebcoder.gs_back.dtos.ItemDto();
                idto.setId(it.getId());
                idto.setName(it.getName());
                idto.setDescription(it.getDescription());
                idto.setPrice(it.getPrice());
                idto.setCategory(it.getCategory() != null ? it.getCategory().name() : null);
                idto.setCondition(it.getCondition());
                idto.setBrand(it.getBrand());
                idto.setModel(it.getModel());
                idto.setImageUrl(it.getImageUrl());
                idto.setAvailable(it.isAvailable());
                idto.setSold(it.isSold());
                idto.setSaleId(it.getSale() != null ? it.getSale().getId() : null);
                idto.setHomeId(it.getHome() != null ? it.getHome().getId() : null);
                return idto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }

    private boolean matchesQuery(GarageSaleDto dto, String needle) {
        if (containsIgnoreCase(dto.getSaleName(), needle)) return true;
        if (containsIgnoreCase(dto.getDescription(), needle)) return true;
        if (containsIgnoreCase(dto.getArea(), needle)) return true;
        if (containsIgnoreCase(dto.getCity(), needle)) return true;
        if (dto.getItems() == null) return false;

        return dto.getItems().stream().anyMatch(item ->
                containsIgnoreCase(item.getName(), needle)
                        || containsIgnoreCase(item.getDescription(), needle)
                        || containsIgnoreCase(item.getCategory(), needle)
        );
    }

    private boolean containsIgnoreCase(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }
}
