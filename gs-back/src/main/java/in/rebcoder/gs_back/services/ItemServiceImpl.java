package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.Item;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemServiceImpl implements ItemService{

        @Autowired
        private ItemRepository itemRepository;

        public Item createItem(Item item) {
            return itemRepository.save(item);
        }

        public List<Item> getItemsByHome(Home home) {
            return itemRepository.findByHome(home);
        }

        public Item updateItem(Long id, Item updatedItem) {
            // TODO: Fix this method after model updates
            return itemRepository.findById(id).orElseThrow();
        }

        public void deleteItem(Long id) {
            itemRepository.deleteById(id);
        }


    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

}
