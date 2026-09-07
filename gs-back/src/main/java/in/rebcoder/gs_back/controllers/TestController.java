package in.rebcoder.gs_back.controllers;

import org.springframework.web.bind.annotation.*;
import in.rebcoder.gs_back.models.Home;
import in.rebcoder.gs_back.models.Item;
import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.User;
import in.rebcoder.gs_back.repositories.AppointmentRepository;
import in.rebcoder.gs_back.repositories.HomeRepository;
import in.rebcoder.gs_back.repositories.ItemRepository;
import in.rebcoder.gs_back.repositories.ProfileRepository;
import in.rebcoder.gs_back.repositories.SaleRepository;
import in.rebcoder.gs_back.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Profile("!prod")
public class TestController {

    private final UserRepository userRepository;
    private final HomeRepository homeRepository;
    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;
    private final AppointmentRepository appointmentRepository;
    private final ProfileRepository profileRepository;
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

        // Create (or reuse) home for demoUser1 (seller). Home.seller is a one-to-one relationship
        // with a unique constraint, so re-creating it on every call would violate that constraint as
        // soon as demoUser1 already exists - reuse the existing Home like we already do for the user.
        Home home = homeRepository.findBySeller(demoUser1).orElseGet(() -> {
            Home h = new Home();
            h.setAddress("123 Demo St");
            h.setArea("DemoArea");
            h.setCity("DemoCity");
            h.setLatitude(12.34);
            h.setLongitude(56.78);
            h.setSeller(demoUser1);
            return homeRepository.save(h);
        });

        // Create (or reuse) the demo sale - same idempotency concern as Home above.
        Sale sale = saleRepository.findBySeller(demoUser1).stream()
                .filter(s -> "Demo Garage Sale".equals(s.getSaleName()))
                .findFirst()
                .orElseGet(() -> {
                    Sale s = new Sale();
                    s.setSaleName("Demo Garage Sale");
                    s.setDescription("Demo items for sale");
                    s.setSaleDate(LocalDate.now().plusDays(7));
                    s.setStartTime(LocalTime.of(9, 0));
                    s.setEndTime(LocalTime.of(17, 0));
                    s.setArea(home.getArea());
                    s.setCity(home.getCity());
                    s.setLatitude(home.getLatitude());
                    s.setLongitude(home.getLongitude());
                    s.setHome(home);
                    s.setSeller(demoUser1);
                    return saleRepository.save(s);
                });

        // Create (or reuse) demo items under that sale.
        List<Item> existingItems = itemRepository.findBySaleId(sale.getId());
        if (existingItems.stream().noneMatch(i -> "Vintage Lamp".equals(i.getName()))) {
            Item item1 = new Item();
            item1.setName("Vintage Lamp");
            item1.setDescription("A nice vintage lamp");
            item1.setPrice(BigDecimal.valueOf(25.00));
            item1.setCategory(in.rebcoder.gs_back.models.ItemCategory.HOME_DECOR);
            item1.setHome(home);
            item1.setSale(sale);
            itemRepository.save(item1);
        }
        if (existingItems.stream().noneMatch(i -> "Wooden Chair".equals(i.getName()))) {
            Item item2 = new Item();
            item2.setName("Wooden Chair");
            item2.setDescription("Solid wooden chair");
            item2.setPrice(BigDecimal.valueOf(40.00));
            item2.setCategory(in.rebcoder.gs_back.models.ItemCategory.FURNITURE);
            item2.setHome(home);
            item2.setSale(sale);
            itemRepository.save(item2);
        }

        return ResponseEntity.ok("Seeded demo data: users, home, sale, items");
    }

    @PostMapping("/clear-demo")
    public ResponseEntity<String> clearDemoData() {
        // Remove demo users and associated data
        List<String> demoUsernames = List.of("demo_user", "demo_user2", "demo_seller", "demo_buyer", "seed_seller", "new_seller", "sale_seller", "smoketest", "smoketest_buyer");
        for (String uname : demoUsernames) {
            userRepository.findByUsername(uname).ifPresent(user -> {
                // Delete appointments where this user is buyer or seller first - Appointment has FK
                // references to User, so deleting the user first (as this used to do) throws a
                // foreign-key ConstraintViolationException as soon as any appointment exists.
                appointmentRepository.findByBuyer(user).forEach(appointmentRepository::delete);
                appointmentRepository.findBySeller(user).forEach(appointmentRepository::delete);

                // delete sales and items by this seller
                List<Sale> sales = saleRepository.findBySeller(user);
                for (Sale s : sales) {
                    itemRepository.findBySaleId(s.getId()).forEach(itemRepository::delete);
                    saleRepository.delete(s);
                }

                // delete home if exists
                homeRepository.findBySeller(user).ifPresent(homeRepository::delete);

                // delete profile if exists - same FK-ordering issue as appointments above.
                // Fully-qualified to avoid clashing with the org.springframework.context.annotation.Profile
                // import used by this class's own @Profile("!prod") annotation.
                in.rebcoder.gs_back.models.Profile profile = profileRepository.findByUser(user);
                if (profile != null) {
                    profileRepository.delete(profile);
                }

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
