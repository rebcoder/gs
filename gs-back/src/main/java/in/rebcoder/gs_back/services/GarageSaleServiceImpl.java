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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GarageSaleServiceImpl implements GarageSaleService {

    private final SaleRepository saleRepository;
    private final HomeRepository homeRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final in.rebcoder.gs_back.repositories.ItemRepository itemRepository;

    @Override
    public List<GarageSaleDto> searchGarageSales(String city, String area, Double latitude, Double longitude,
                                                 Integer radiusKm, String category, String status) {
        try {
            List<Sale> sales = saleRepository.findAll();
            System.out.println("DEBUG: Found " + sales.size() + " sales in database");
            List<GarageSaleDto> dtos = sales.stream().map(this::toDto).collect(Collectors.toList());
            System.out.println("DEBUG: Converted to " + dtos.size() + " DTOs");
            return dtos;
        } catch (Exception e) {
            System.err.println("ERROR in searchGarageSales: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    public GarageSaleDto getGarageSaleById(Long id) {
        try {
            System.out.println("DEBUG: Looking for sale with ID: " + id);
            Sale sale = saleRepository.findById(id).orElseThrow(() -> new RuntimeException("Sale not found"));
            System.out.println("DEBUG: Found sale: " + sale.getSaleName());
            GarageSaleDto dto = toDto(sale);
            System.out.println("DEBUG: Converted to DTO: " + dto.getSaleName());
            return dto;
        } catch (Exception e) {
            System.err.println("ERROR in getGarageSaleById: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
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
        int maxPerSlot = garageSaleDto.getMaxAppointmentsPerSlot() != null ? garageSaleDto.getMaxAppointmentsPerSlot() : 3;
        sale.setMaxAppointmentsPerSlot(Math.max(1, maxPerSlot));
        sale.setSeller(user);
        sale.setHome(home);

        sale = saleRepository.save(sale);
        return toDto(sale);
    }

    @Override
    public GarageSaleDto updateGarageSale(Long id, GarageSaleDto garageSaleDto) {
        Sale sale = saleRepository.findById(id).orElseThrow(() -> new RuntimeException("Sale not found"));
        sale.setSaleName(garageSaleDto.getSaleName());
        sale.setDescription(garageSaleDto.getDescription());
        if (garageSaleDto.getSaleDate() != null) sale.setSaleDate(garageSaleDto.getSaleDate());
        if (garageSaleDto.getStartTime() != null) sale.setStartTime(garageSaleDto.getStartTime());
        if (garageSaleDto.getEndTime() != null) sale.setEndTime(garageSaleDto.getEndTime());
        sale.setArea(garageSaleDto.getArea());
        sale.setCity(garageSaleDto.getCity());
        if (garageSaleDto.getMaxAppointmentsPerSlot() != null) {
            sale.setMaxAppointmentsPerSlot(garageSaleDto.getMaxAppointmentsPerSlot());
        }
        sale = saleRepository.save(sale);
        return toDto(sale);
    }

    @Override
    public void deleteGarageSale(Long id) {
        saleRepository.deleteById(id);
    }

    @Override
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
        if (itemDto.getCategory() != null) {
            try {
                item.setCategory(in.rebcoder.gs_back.models.ItemCategory.valueOf(itemDto.getCategory()));
            } catch (Exception ignored) {}
        }
        // associate sale
        Sale sale = saleRepository.findById(saleId).orElseThrow(() -> new RuntimeException("Sale not found"));
        item.setSale(sale);
        // associate home if provided
        if (itemDto.getHomeId() != null) {
            homeRepository.findById(itemDto.getHomeId()).ifPresent(item::setHome);
        }
        in.rebcoder.gs_back.repositories.ItemRepository repo = (in.rebcoder.gs_back.repositories.ItemRepository) itemRepository;
        repo.save(item);
        itemDto.setId(item.getId());
        return itemDto;
    }

    @Override
    public ItemDto updateItem(Long saleId, Long itemId, ItemDto itemDto) {
        in.rebcoder.gs_back.models.Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (saleId != null) {
            Sale sale = saleRepository.findById(saleId)
                    .orElseThrow(() -> new RuntimeException("Sale not found"));
            item.setSale(sale);
        }
        if (itemDto.getName() != null) item.setName(itemDto.getName());
        if (itemDto.getDescription() != null) item.setDescription(itemDto.getDescription());
        if (itemDto.getPrice() != null) item.setPrice(itemDto.getPrice());
        if (itemDto.getCategory() != null) {
            try { item.setCategory(in.rebcoder.gs_back.models.ItemCategory.valueOf(itemDto.getCategory())); } catch (Exception ignored) {}
        }
        item.setAvailable(itemDto.isAvailable());
        item.setSold(itemDto.isSold());

        itemRepository.save(item);
        itemDto.setId(item.getId());
        itemDto.setSaleId(item.getSale() != null ? item.getSale().getId() : null);
        return itemDto;
    }

    @Override
    public void removeItemFromGarageSale(Long saleId, Long itemId) {
        in.rebcoder.gs_back.models.Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (saleId != null && item.getSale() != null && !item.getSale().getId().equals(saleId)) {
            throw new RuntimeException("Item does not belong to the provided sale");
        }
        itemRepository.delete(item);
    }

    @Override
    public List<AppointmentDto> getGarageSaleAppointments(Long saleId) {
        return List.of();
    }

    @Override
    public List<GarageSaleDto> getNearbyGarageSales(Double latitude, Double longitude, Integer radiusKm) {
        return searchGarageSales(null, null, latitude, longitude, radiusKm, null, null);
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
                idto.setAvailable(it.isAvailable());
                idto.setSold(it.isSold());
                idto.setSaleId(it.getSale() != null ? it.getSale().getId() : null);
                idto.setHomeId(it.getHome() != null ? it.getHome().getId() : null);
                return idto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
