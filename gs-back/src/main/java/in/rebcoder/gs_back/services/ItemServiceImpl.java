package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.exception.ResourceNotFoundException;
import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.Item;
import in.rebcoder.gs_back.repositories.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ItemServiceImpl implements ItemService{

        @Autowired
        private ItemRepository itemRepository;

        private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
        private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "image/gif"
        );
        private static final Path ITEM_UPLOAD_DIR = Paths.get("uploads", "items");

        public Item createItem(Item item) {
            return itemRepository.save(item);
        }

        public List<Item> getItemsByHome(Home home) {
            return itemRepository.findByHome(home);
        }

        public Item updateItem(Long id, Item updatedItem) {
            Item item = itemRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

            if (updatedItem.getName() != null) item.setName(updatedItem.getName());
            if (updatedItem.getDescription() != null) item.setDescription(updatedItem.getDescription());
            if (updatedItem.getPrice() != null) item.setPrice(updatedItem.getPrice());
            if (updatedItem.getCategory() != null) item.setCategory(updatedItem.getCategory());
            if (updatedItem.getCondition() != null) item.setCondition(updatedItem.getCondition());
            if (updatedItem.getBrand() != null) item.setBrand(updatedItem.getBrand());
            if (updatedItem.getModel() != null) item.setModel(updatedItem.getModel());
            if (updatedItem.getImageUrl() != null) item.setImageUrl(updatedItem.getImageUrl());
            if (updatedItem.getSale() != null) item.setSale(updatedItem.getSale());
            if (updatedItem.getHome() != null) item.setHome(updatedItem.getHome());
            item.setAvailable(updatedItem.isAvailable());
            item.setSold(updatedItem.isSold());

            return itemRepository.save(item);
        }

        public void deleteItem(Long id) {
            itemRepository.deleteById(id);
        }

    @Override
    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
    }

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @Override
    public Item uploadItemImage(Long itemId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image size cannot exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Unsupported image type. Allowed: JPG, PNG, WEBP, GIF");
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        try {
            Files.createDirectories(ITEM_UPLOAD_DIR);
            String extension = resolveExtension(file.getOriginalFilename(), contentType);
            String fileName = "item-" + itemId + "-" + UUID.randomUUID() + extension;
            Path targetPath = ITEM_UPLOAD_DIR.resolve(fileName).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            item.setImageUrl("/uploads/items/" + fileName);
            return itemRepository.save(item);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store item image", e);
        }
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (ext.matches("\\.(jpg|jpeg|png|webp|gif)")) {
                return ext;
            }
        }

        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".img";
        };
    }

}
