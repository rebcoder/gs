package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.dtos.GarageSaleDto;
import in.rebcoder.gs_back.dtos.ItemDto;
import in.rebcoder.gs_back.services.GarageSaleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/garage-sales")
@CrossOrigin(origins = "*")
public class GarageSaleController {
    private final GarageSaleService garageSaleService;

    public GarageSaleController(GarageSaleService garageSaleService) {
        this.garageSaleService = garageSaleService;
    }

    // Minimal working endpoints so frontend can consume
    @GetMapping
    public ResponseEntity<List<GarageSaleDto>> getAllGarageSales() {
        return ResponseEntity.ok(garageSaleService.searchGarageSales(null,null,null,null,null,null,null));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<GarageSaleDto>> getMyGarageSales(Authentication authentication) {
        return ResponseEntity.ok(garageSaleService.getGarageSalesBySeller(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GarageSaleDto> getGarageSale(@PathVariable Long id) {
        return ResponseEntity.ok(garageSaleService.getGarageSaleById(id));
    }

    @PostMapping
    public ResponseEntity<GarageSaleDto> createGarageSale(@RequestBody GarageSaleDto dto) {
        return ResponseEntity.ok(garageSaleService.createGarageSale(dto));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ItemDto> addItemToGarageSale(@PathVariable Long id, @RequestBody ItemDto itemDto) {
        return ResponseEntity.ok(garageSaleService.addItemToGarageSale(id, itemDto));
    }

    @PutMapping("/{saleId}/items/{itemId}")
    public ResponseEntity<ItemDto> updateItem(@PathVariable Long saleId, @PathVariable Long itemId, @RequestBody ItemDto itemDto) {
        return ResponseEntity.ok(garageSaleService.updateItem(saleId, itemId, itemDto));
    }

    @DeleteMapping("/{saleId}/items/{itemId}")
    public ResponseEntity<Void> removeItemFromGarageSale(@PathVariable Long saleId, @PathVariable Long itemId) {
        garageSaleService.removeItemFromGarageSale(saleId, itemId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGarageSale(@PathVariable Long id, Authentication authentication) {
        garageSaleService.deleteGarageSale(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /*
    @GetMapping
    public ResponseEntity<List<GarageSaleDto>> getAllGarageSales(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Integer radiusKm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(garageSaleService.searchGarageSales(city, area, latitude, longitude, radiusKm, category, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GarageSaleDto> getGarageSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(garageSaleService.getGarageSaleById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<GarageSaleDto> updateGarageSale(@PathVariable Long id, @RequestBody GarageSaleDto garageSaleDto) {
        return ResponseEntity.ok(garageSaleService.updateGarageSale(id, garageSaleDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> deleteGarageSale(@PathVariable Long id) {
        garageSaleService.deleteGarageSale(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ItemDto> addItemToGarageSale(@PathVariable Long id, @RequestBody ItemDto itemDto) {
        return ResponseEntity.ok(garageSaleService.addItemToGarageSale(id, itemDto));
    }

    @PutMapping("/{saleId}/items/{itemId}")
    public ResponseEntity<ItemDto> updateItem(@PathVariable Long saleId, @PathVariable Long itemId, @RequestBody ItemDto itemDto) {
        return ResponseEntity.ok(garageSaleService.updateItem(saleId, itemId, itemDto));
    }

    @DeleteMapping("/{saleId}/items/{itemId}")
    public ResponseEntity<Void> removeItemFromGarageSale(@PathVariable Long saleId, @PathVariable Long itemId) {
        garageSaleService.removeItemFromGarageSale(saleId, itemId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/appointments")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<AppointmentDto>> getGarageSaleAppointments(@PathVariable Long id) {
        return ResponseEntity.ok(garageSaleService.getGarageSaleAppointments(id));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<GarageSaleDto>> getNearbyGarageSales(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Integer radiusKm) {
        return ResponseEntity.ok(garageSaleService.getNearbyGarageSales(latitude, longitude, radiusKm));
    }
    */
}
