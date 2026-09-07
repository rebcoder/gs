package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.models.Item;
import in.rebcoder.gs_back.models.ItemCategory;
import in.rebcoder.gs_back.repositories.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regression coverage for the previously no-op ItemServiceImpl#updateItem stub,
 * which loaded the item but never applied the incoming update payload.
 */
public class ItemServiceImplTest {

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private ItemServiceImpl itemService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void updateItemAppliesAllIncomingFieldsAndPersists() {
        Item existing = new Item();
        existing.setId(1L);
        existing.setName("Old Name");
        existing.setDescription("Old description");
        existing.setPrice(BigDecimal.valueOf(10));
        existing.setCategory(ItemCategory.OTHER);
        existing.setCondition("GOOD");
        existing.setBrand("OldBrand");
        existing.setModel("OldModel");
        existing.setAvailable(true);
        existing.setSold(false);

        Item incoming = new Item();
        incoming.setName("New Name");
        incoming.setDescription("New description");
        incoming.setPrice(BigDecimal.valueOf(25));
        incoming.setCategory(ItemCategory.ELECTRONICS);
        incoming.setCondition("LIKE_NEW");
        incoming.setBrand("NewBrand");
        incoming.setModel("NewModel");
        incoming.setAvailable(false);
        incoming.setSold(true);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(itemRepository.save(any(Item.class))).thenAnswer(i -> i.getArgument(0));

        Item result = itemService.updateItem(1L, incoming);

        assertEquals("New Name", result.getName());
        assertEquals("New description", result.getDescription());
        assertEquals(0, BigDecimal.valueOf(25).compareTo(result.getPrice()));
        assertEquals(ItemCategory.ELECTRONICS, result.getCategory());
        assertEquals("LIKE_NEW", result.getCondition());
        assertEquals("NewBrand", result.getBrand());
        assertEquals("NewModel", result.getModel());
        assertEquals(false, result.isAvailable());
        assertEquals(true, result.isSold());
        verify(itemRepository, times(1)).save(existing);
    }

    @Test
    void updateItemThrowsResourceNotFoundExceptionWhenMissing() {
        when(itemRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> itemService.updateItem(404L, new Item()));
    }
}
