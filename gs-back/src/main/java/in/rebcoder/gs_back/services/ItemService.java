package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.Item;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


public interface ItemService {

    Item createItem(Item item);

    List<Item> getItemsByHome(Home home);

    Item updateItem(Long id, Item updatedItem);

    void deleteItem(Long id);

    Item getItemById(Long id);

    List<Item> getAllItems();

    Item uploadItemImage(Long itemId, MultipartFile file);

}
