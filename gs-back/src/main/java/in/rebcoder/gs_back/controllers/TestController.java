package in.rebcoder.gs_back.controllers;

import org.springframework.web.bind.annotation.*;
import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.Item;
import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.HomeRepository;
import in.rebcoder.gs_back.repositories.ItemRepository;
import in.rebcoder.gs_back.repositories.SaleRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TestController {

    private final UserRepository userRepository;
    private final HomeRepository homeRepository;
    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/health")
    public String health() {
        return "Backend is running!";
    }

    @GetMapping("/garage-sales")
    public String getGarageSales() {
        return "Garage sales endpoint is working!";
    }

    @PostMapping("/seed-demo")
    public ResponseEntity<String> seedDemoData() {
        // Create demo users (role-free system)
        User demoUser1 = userRepository.findByUsername("demo_user").orElseGet(() -> {
            User u = new User();
            u.setUsername("demo_user");
            u.setEmail("demo_user@example.com");
            u.setPassword(passwordEncoder.encode("demo123"));
            u.setFirstName("Demo");
            u.setLastName("User");
            return userRepository.save(u);
        });

        User demoUser2 = userRepository.findByUsername("demo_user2").orElseGet(() -> {
            User u = new User();
            u.setUsername("demo_user2");
            u.setEmail("demo_user2@example.com");
            u.setPassword(passwordEncoder.encode("demo123"));
            u.setFirstName("Demo");
            u.setLastName("User 2");
            return userRepository.save(u);
        });

        // Create home for demoUser1 (seller)
        Home home = new Home();
        home.setAddress("123 Demo St");
        home.setArea("DemoArea");
        home.setCity("DemoCity");
        home.setLatitude(12.34);
        home.setLongitude(56.78);
        home.setSeller(demoUser1);
        homeRepository.save(home);

        // Create sale
        Sale sale = new Sale();
        sale.setSaleName("Demo Garage Sale");
        sale.setDescription("Demo items for sale");
        sale.setSaleDate(LocalDate.now().plusDays(7));
        sale.setStartTime(LocalTime.of(9,0));
        sale.setEndTime(LocalTime.of(17,0));
        sale.setArea(home.getArea());
        sale.setCity(home.getCity());
        sale.setLatitude(home.getLatitude());
        sale.setLongitude(home.getLongitude());
        sale.setHome(home);
        sale.setSeller(demoUser1);
        saleRepository.save(sale);

        // Create items
        Item item1 = new Item();
        item1.setName("Vintage Lamp");
        item1.setDescription("A nice vintage lamp");
        item1.setPrice(BigDecimal.valueOf(25.00));
        item1.setCategory(in.rebcoder.gs_back.models.ItemCategory.HOME_DECOR);
        item1.setHome(home);
        item1.setSale(sale);
        itemRepository.save(item1);

        Item item2 = new Item();
        item2.setName("Wooden Chair");
        item2.setDescription("Solid wooden chair");
        item2.setPrice(BigDecimal.valueOf(40.00));
        item2.setCategory(in.rebcoder.gs_back.models.ItemCategory.FURNITURE);
        item2.setHome(home);
        item2.setSale(sale);
        itemRepository.save(item2);

        return ResponseEntity.ok("Seeded demo data: users, home, sale, items");
    }

    @PostMapping("/clear-demo")
    public ResponseEntity<String> clearDemoData() {
        // Remove demo users and associated data
        List<String> demoUsernames = List.of("demo_user", "demo_user2", "demo_seller", "demo_buyer", "seed_seller", "new_seller", "sale_seller", "smoketest", "smoketest_buyer");
        for (String uname : demoUsernames) {
            userRepository.findByUsername(uname).ifPresent(user -> {
                // delete sales and items by this seller
                List<Sale> sales = saleRepository.findBySeller(user);
                for (Sale s : sales) {
                    itemRepository.findBySaleId(s.getId()).forEach(itemRepository::delete);
                    saleRepository.delete(s);
                }

                // delete home if exists
                homeRepository.findBySeller(user).ifPresent(homeRepository::delete);

                // finally delete user
                userRepository.delete(user);
            });
        }

        return ResponseEntity.ok("Cleared demo data");
    }

    @GetMapping("/demo-info")
    public ResponseEntity<?> demoInfo() {
        // return ids of demo entities if present (role-free)
        var user1Opt = userRepository.findByUsername("demo_user");
        var user2Opt = userRepository.findByUsername("demo_user2");
        var homeOpt = homeRepository.findBySeller(user1Opt.orElse(null));
        var sales = saleRepository.findAll();

        var resp = new java.util.HashMap<String, Object>();
        user1Opt.ifPresent(u -> resp.put("demoUser1Id", u.getId()));
        user2Opt.ifPresent(u -> resp.put("demoUser2Id", u.getId()));
        homeOpt.ifPresent(h -> {
            resp.put("homeId", h.getId());
            resp.put("homeArea", h.getArea());
        });
        if (!sales.isEmpty()) {
            var s = sales.get(0);
            resp.put("saleId", s.getId());
            if (s.getSaleDate() != null) {
                resp.put("saleDate", s.getSaleDate().toString());
            }
        }

        return ResponseEntity.ok(resp);
    }
}
