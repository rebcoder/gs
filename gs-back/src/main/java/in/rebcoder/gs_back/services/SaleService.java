package in.rebcoder.gs_back.services;

import in.rebcoder.gs_back.models.Sale;
import in.rebcoder.gs_back.models.User;

import java.util.List;

public interface SaleService {
    Sale createSale(Sale sale);

    Sale addItemToSale(Long saleId, Long itemId);

    List<Sale> getSalesBySeller(User seller);
}
