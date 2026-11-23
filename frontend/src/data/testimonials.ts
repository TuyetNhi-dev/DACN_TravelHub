/**
 * SAMPLE reviews for the project demo. They are written by the team, not by real customers, and the home page
 * labels them as such ("Đánh giá mô phỏng"). Replace with real reviews only once the system collects them.
 */
export interface SampleReview {
  id: string;
  /** First name and initial only, so no sample reads like a real person's full identity. */
  author: string;
  trip: string;
  score: number;
  text: string;
}

export const SAMPLE_REVIEWS: SampleReview[] = [
  { id: "r1", author: "Chị Lan H.", trip: "Đà Nẵng – Hội An – Bà Nà Hills", score: 5,
    text: "Đặt tour cho cả nhà bốn người rất nhanh, chỗ giữ ngay nên không phải lo hết chỗ. Lịch trình vừa sức, "
      + "hướng dẫn viên chu đáo với hai bé." },
  { id: "r2", author: "Anh Minh T.", trip: "Hạ Long – Du thuyền ngủ đêm", score: 5,
    text: "Thích nhất là giá ghi rõ từ đầu, không phát sinh. Ngủ đêm trên vịnh, sáng ra chèo kayak, đáng đồng tiền." },
  { id: "r3", author: "Bạn Thảo N.", trip: "Đà Lạt – Thành phố ngàn hoa", score: 4,
    text: "Lần đầu đi tour một mình mà thấy yên tâm. Trang theo dõi đơn dễ hiểu, "
      + "nhân viên gọi xác nhận ngay hôm sau." },
];
