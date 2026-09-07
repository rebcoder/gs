package in.rebcoder.gs_back.controllers;

import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.models.Item;
import in.rebcoder.gs_back.services.ItemService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ItemController.class)
@AutoConfigureMockMvc(addFilters = false)
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ItemService itemService;

    @Test
    void getItemByIdReturnsNotFoundWhenMissing() throws Exception {
        when(itemService.getItemById(99L)).thenThrow(new ResourceNotFoundException("Item not found"));

        mockMvc.perform(get("/api/items/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getItemByIdReturnsItemWhenPresent() throws Exception {
        Item item = new Item();
        item.setId(1L);
        item.setName("Lamp");
        when(itemService.getItemById(1L)).thenReturn(item);

        mockMvc.perform(get("/api/items/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Lamp"));
    }

    @Test
    void updateItemPersistsChangesAndReturnsUpdatedItem() throws Exception {
        Item updated = new Item();
        updated.setId(1L);
        updated.setName("Updated Lamp");
        updated.setDescription("Now with a new shade");
        updated.setPrice(BigDecimal.valueOf(30));
        when(itemService.updateItem(eq(1L), any(Item.class))).thenReturn(updated);

        mockMvc.perform(put("/api/items/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "name": "Updated Lamp", "description": "Now with a new shade", "price": 30 }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Updated Lamp"))
                .andExpect(jsonPath("$.description").value("Now with a new shade"))
                .andExpect(jsonPath("$.price").value(30));
    }
}
