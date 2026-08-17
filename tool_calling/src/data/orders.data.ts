export const ORDERS = [
    {
        _id: '65c73049683590129272064c',
        customerId: '65c730496835901292720649',
        orderDate: '2026-01-01',
        totalAmount: 100,
        status: 'PENDING',
        items: [
            {
                _id: '65c73049683590129272064d',
                name: 'Product 1',
                quantity: 1,
                price: 100
            }
        ]
    },
    {
        _id: '65c73049683590129272064e',
        customerId: '65c730496835901292720649',
        orderDate: '2026-01-02',
        totalAmount: 200,
        status: 'SHIPPED',
        items: [
            {
                _id: '65c73049683590129272064f',
                name: 'Product 2',
                quantity: 2,
                price: 200
            }
        ]
    },
    {
        _id: '65c73049683590129272064g',
        customerId: '65c73049683590129272064a',
        orderDate: '2026-01-03',
        totalAmount: 300,
        status: 'DELIVERED',
        items: [
            {
                _id: '65c73049683590129272064h',
                name: 'Product 3',
                quantity: 3,
                price: 300
            }
        ]
    }
]