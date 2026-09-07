package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.dtos.AppointmentDto;
import in.rebcoder.gs_back.dtos.GarageSaleDto;
import in.rebcoder.gs_back.dtos.ItemDto;

import java.util.List;

public interface GarageSaleService {
    
    List<GarageSaleDto> searchGarageSales(String city, String area, Double latitude, Double longitude, 
                                         Integer radiusKm, String category, String status);

    List<GarageSaleDto> searchGarageSalesByQuery(String query);

    List<GarageSaleDto> getFeaturedGarageSales();
    
    GarageSaleDto getGarageSaleById(Long id);
    
    GarageSaleDto createGarageSale(GarageSaleDto garageSaleDto);
    
    GarageSaleDto updateGarageSale(Long id, GarageSaleDto garageSaleDto);
    
    void deleteGarageSale(Long id);

    void deleteGarageSale(Long id, String username);

    List<GarageSaleDto> getGarageSalesBySeller(String username);
    
    ItemDto addItemToGarageSale(Long saleId, ItemDto itemDto);
    
    ItemDto updateItem(Long saleId, Long itemId, ItemDto itemDto);
    
    void removeItemFromGarageSale(Long saleId, Long itemId);
    
    List<AppointmentDto> getGarageSaleAppointments(Long saleId);
    
    List<GarageSaleDto> getNearbyGarageSales(Double latitude, Double longitude, Integer radiusKm);
}
