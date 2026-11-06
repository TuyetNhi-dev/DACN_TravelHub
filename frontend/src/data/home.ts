export const photos = {
  hero: "https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
  halong: "https://images.unsplash.com/photo-1561461221-959c3f16234b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
  hoian: "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
  danang: "https://images.unsplash.com/photo-1723142282970-1fd415eec1ad?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
  resort: "https://images.unsplash.com/photo-1601972888880-3ad2df3ee0a0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
};

export const destinations = [
 { name: "Vịnh Hạ Long", count: "Khám phá vịnh biển", image: photos.halong },
 { name: "Hội An", count: "Khám phá phố cổ", image: photos.hoian },
 { name: "Đà Nẵng", count: "Khám phá thành phố biển", image: photos.danang },
 { name: "Nha Trang", count: "Khám phá đảo và biển", image: photos.resort },
];
export const benefits = [
 { icon: "shield", title: "Thông tin rõ ràng", text: "Phân biệt dữ liệu tham khảo và lịch khởi hành trong hệ thống." },
 { icon: "wallet", title: "Giá tham khảo minh bạch", text: "Xem giá trước khi lựa chọn hành trình phù hợp." },
 { icon: "headphones", title: "Hỗ trợ tận tâm", text: "Xem thông tin liên hệ ở cuối trang để được tư vấn." },
] as const;
export const navigation = [
 { label: "Trang chủ", href: "/" },
 { label: "Tour du lịch", href: "/tours" },
 { label: "Khách sạn", href: "/hotels" },
 { label: "Vé máy bay", href: "/flights" },
 { label: "Ưu đãi", href: "/#services" },
];

