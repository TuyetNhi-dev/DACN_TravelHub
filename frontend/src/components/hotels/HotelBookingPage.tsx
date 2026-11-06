"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/format";
import {
  displayStayDate, roomBookingIssue, stayNights, stayParams, stayTotal, validateContact,
} from "@/lib/hotel-stay";
import { HotelBreadcrumb, HotelSourceNotice, HotelStatus, StayFields, useHotelResource } from "./hotel-shared";
import type { Hotel, HotelDetail, HotelRoom, HotelSource, Stay } from "@/types/hotel";

interface HotelBookingProps {
  hotelId: string;
  source: HotelSource;
  initialStay: Stay;
  initialRoom: string;
}

const bookingSteps = [
  { label: "Lịch & phòng", title: "Chọn phòng và lịch lưu trú" },
  { label: "Liên hệ", title: "Thông tin người liên hệ" },
  { label: "Kiểm tra", title: "Kiểm tra yêu cầu demo" },
  { label: "Hoàn tất demo", title: "Đã hoàn tất trải nghiệm demo" },
];

export function HotelBookingPage({ hotelId, source, initialStay, initialRoom }: HotelBookingProps) {
  const { state, retry } = useHotelResource(source, hotelId);

  return (
    <main id="main-content" className="sh-hotels">
      <div className="container sh-hotel-body">
        <HotelBreadcrumb title="Đặt phòng demo" source={source} hotelId={hotelId} />
        <HotelSourceNotice source={source} stay={initialStay} />
        {state.status !== "ready" && <HotelStatus status={state.status} retry={retry} />}
        {state.status === "ready" && state.detail && (
          <BookingFlow detail={state.detail} source={source} initialStay={initialStay} initialRoom={initialRoom} />
        )}
      </div>
    </main>
  );
}

function BookingFlow({ detail: { hotel, rooms }, source, initialStay, initialRoom }: {
  detail: HotelDetail;
  source: HotelSource;
  initialStay: Stay;
  initialRoom: string;
}) {
  const initialRoomExists = rooms.some(room => room.roomId === initialRoom);
  const [step, setStep] = useState(1);
  const [stay, setStay] = useState(initialStay);
  const [roomId, setRoomId] = useState(initialRoomExists ? initialRoom : "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const room = rooms.find(item => item.roomId === roomId);
  const title = bookingSteps[step - 1].title;

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  function move(nextStep: number) {
    setError(null);
    setStep(nextStep);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room) {
      setError("Vui lòng chọn một loại phòng trong danh mục.");
      return;
    }

    const stayIssue = roomBookingIssue(room, stay);
    if (stayIssue) {
      setError(stayIssue);
      return;
    }

    if (step >= 2) {
      const contactIssue = validateContact(name, email, phone);
      if (contactIssue) {
        setError(contactIssue);
        return;
      }
    }

    if (step === 3 && !agreed) {
      setError("Vui lòng xác nhận bạn hiểu đây là quy trình demo.");
      return;
    }

    move(step + 1);
  }

  function changeStay(value: Stay) {
    setStay(value);
    setAgreed(false);
    setError(null);
  }

  function changeRoom(value: string) {
    setRoomId(value);
    setAgreed(false);
    setError(null);
  }

  function restart() {
    setName("");
    setEmail("");
    setPhone("");
    setNote("");
    setAgreed(false);
    move(1);
  }

  const hotelHref = "/hotels/" + encodeURIComponent(hotel.hotelId) + "?" + stayParams(stay, source);

  return (
    <>
      <div className="sh-hotel-booking-heading">
        <span className="kicker">SÀIHÀNH · ĐẶT PHÒNG MÔ PHỎNG</span>
        <h1 ref={heading} tabIndex={-1}>{title}</h1>
        <p>{hotel.tenKhachSan || hotel.hotelId} · {hotel.thanhPho}</p>
      </div>
      <ol className="sh-hotel-steps" aria-label="Tiến trình đặt phòng">
        {bookingSteps.map(({ label }, index) => (
          <li
            key={label}
            className={step >= index + 1 ? "is-current" : ""}
            aria-current={step === index + 1 ? "step" : undefined}
          >
            <span>{step > index + 1 ? <Icon name="check" size={17} /> : index + 1}</span>
            <b>{label}</b>
          </li>
        ))}
      </ol>

      <div className="sh-hotel-booking-layout">
        <section className="sh-hotel-panel">
          {step < 4 ? (
            <form aria-label={title} onSubmit={handleSubmit} aria-describedby="hotel-booking-privacy">
              {step === 1 && (
                <>
                  <h2>Thiết lập kỳ nghỉ của bạn</h2>
                  {initialRoom && !initialRoomExists && (
                    <p className="sh-hotel-error" role="alert">Loại phòng trong liên kết không tồn tại. Vui lòng chọn lại.</p>
                  )}
                  <StayFields stay={stay} onChange={changeStay} />
                  <label className="sh-hotel-form-label">
                    Loại phòng
                    <select value={roomId} required onChange={event => changeRoom(event.target.value)}>
                      <option value="">Chọn loại phòng</option>
                      {rooms.map(item => (
                        <option
                          key={item.roomId}
                          value={item.roomId}
                          disabled={item.soPhongCon === 0 || item.giaVndDem === null || !item.sucChua}
                        >
                          {item.loaiPhong || item.roomId} · {formatCurrency(item.giaVndDem)} / đêm
                          {item.soPhongCon === 0 && " · Hết phòng trong danh mục"}
                        </option>
                      ))}
                    </select>
                  </label>
                  {rooms.length === 0 && (
                    <p>
                      Khách sạn chưa có dữ liệu phòng.{" "}
                      <Link className="view-all" href={"/hotels?source=" + source}>Chọn khách sạn khác</Link>
                    </p>
                  )}
                  {room && (
                    <div className="sh-hotel-callout">
                      <Icon name="hotel" />
                      <p>
                        Sức chứa: {room.sucChua ?? "chưa có"} khách / phòng. Số lượng tham khảo: {room.soPhongCon ?? "chưa có"}.
                        Không phải kết quả kiểm tra phòng trống theo ngày.
                      </p>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2>Ai sẽ liên hệ với nơi lưu trú?</h2>
                  <p className="sh-hotel-caption">
                    Dùng thông tin giả định để thử giao diện. Không cần nhập giấy tờ tùy thân hoặc thông tin thanh toán.
                  </p>
                  <label className="sh-hotel-form-label">
                    Họ và tên
                    <input
                      autoComplete="off"
                      value={name}
                      minLength={2}
                      maxLength={100}
                      required
                      onChange={event => setName(event.target.value)}
                      placeholder="Nguyễn Minh Anh (demo)"
                    />
                  </label>
                  <div className="sh-hotel-contact-grid">
                    <label className="sh-hotel-form-label">
                      Email
                      <input
                        autoComplete="off"
                        type="email"
                        value={email}
                        required
                        maxLength={200}
                        onChange={event => setEmail(event.target.value)}
                        placeholder="khach@example.com"
                      />
                    </label>
                    <label className="sh-hotel-form-label">
                      Số điện thoại
                      <input
                        autoComplete="off"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        required
                        maxLength={20}
                        onChange={event => setPhone(event.target.value)}
                        placeholder="0900 000 000"
                      />
                    </label>
                  </div>
                  <label className="sh-hotel-form-label">
                    Yêu cầu thêm (tùy chọn)
                    <textarea
                      value={note}
                      maxLength={500}
                      rows={4}
                      onChange={event => setNote(event.target.value)}
                      placeholder="Ví dụ: mong muốn phòng yên tĩnh. Yêu cầu chưa được gửi đến khách sạn."
                    />
                  </label>
                  <small className="sh-hotel-caption">{note.length}/500 ký tự</small>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="sh-hotel-section-heading">
                    <h2>Thông tin bạn đã nhập</h2>
                    <button className="btn btn-outline" type="button" onClick={() => move(2)}>Chỉnh sửa liên hệ</button>
                  </div>
                  <dl className="sh-hotel-review">
                    <div><dt>Người liên hệ</dt><dd>{name.trim()}</dd></div>
                    <div><dt>Email</dt><dd>{email.trim()}</dd></div>
                    <div><dt>Điện thoại</dt><dd>{phone.trim()}</dd></div>
                    <div><dt>Yêu cầu thêm</dt><dd>{note.trim() || "Không có"}</dd></div>
                  </dl>
                  <div className="sh-hotel-callout">
                    <Icon name="shield" />
                    <p>
                      Không có giao dịch thanh toán, mã giữ phòng hoặc email xác nhận được tạo.
                      Thông tin chỉ tồn tại trong bộ nhớ trang và không được lưu vào localStorage.
                    </p>
                  </div>
                  <label className="sh-hotel-consent">
                    <input type="checkbox" required checked={agreed} onChange={event => setAgreed(event.target.checked)} />
                    <span>Tôi hiểu đây là bản demo, không đặt phòng thật và tổng tiền chỉ là phép tính tham khảo.</span>
                  </label>
                </>
              )}

              {error && <p className="sh-hotel-error" role="alert">{error}</p>}
              <div className="sh-hotel-wizard-actions">
                {step > 1 ? (
                  <button type="button" className="btn btn-outline" onClick={() => move(step - 1)}>Quay lại</button>
                ) : (
                  <Link className="btn btn-outline" href={hotelHref}>Về khách sạn</Link>
                )}
                <button className="btn btn-primary" type="submit">
                  {step === 3 ? "Hoàn tất bản demo" : "Tiếp tục"}<Icon name="arrow" size={17} />
                </button>
              </div>
            </form>
          ) : (
            <div className="sh-hotel-success">
              <span className="sh-hotel-success-icon"><Icon name="check" size={32} /></span>
              <span className="sh-hotel-badge">KẾT QUẢ MÔ PHỎNG · CHƯA ĐẶT PHÒNG</span>
              <h2>Bạn đã trải nghiệm đủ các bước!</h2>
              <p>
                Bản demo cho {hotel.tenKhachSan || hotel.hotelId} đã hoàn tất trên trình duyệt.
                Không có yêu cầu đặt phòng hoặc thông tin liên hệ nào được gửi đi.
              </p>
              <p>
                Không có phòng được giữ, tiền được thu hoặc xác nhận từ khách sạn.
                Để đặt thật cần tích hợp API nghiệp vụ sau này.
              </p>
              <div className="sh-hotel-actions">
                <Link className="btn btn-primary" href={"/hotels?" + stayParams(stay, source)}>Khám phá khách sạn khác</Link>
                <button className="btn btn-outline" onClick={restart}>Thử lại từ đầu</button>
              </div>
            </div>
          )}
          <p id="hotel-booking-privacy" className="sh-hotel-caption">
            Demo frontend · Không gọi API tạo đơn, không lưu thông tin liên hệ vào bộ nhớ lưu trữ của trình duyệt.
            Tải lại trang sẽ mất thông tin đã nhập.
          </p>
        </section>

        <BookingSummary hotel={hotel} room={room} stay={stay} source={source} step={step} onEdit={() => move(1)} />
      </div>
    </>
  );
}

function BookingSummary({ hotel, room, stay, source, step, onEdit }: {
  hotel: Hotel;
  room: HotelRoom | undefined;
  stay: Stay;
  source: HotelSource;
  step: number;
  onEdit: () => void;
}) {
  const nights = stayNights(stay);
  const total = room ? stayTotal(room, stay) : null;

  return (
    <aside className="sh-hotel-panel sh-hotel-booking-summary" aria-label="Tóm tắt kỳ nghỉ">
      <span className="kicker">KỲ NGHỈ CỦA BẠN</span>
      <h2>{hotel.tenKhachSan || hotel.hotelId}</h2>
      <p>{hotel.thanhPho}</p>
      <dl className="sh-hotel-review">
        <div><dt>Loại phòng</dt><dd>{room?.loaiPhong || "Chưa chọn"}</dd></div>
        <div><dt>Nhận phòng</dt><dd>{displayStayDate(stay.checkIn)}</dd></div>
        <div><dt>Trả phòng</dt><dd>{displayStayDate(stay.checkOut)}</dd></div>
        <div><dt>Thời gian</dt><dd>{nights || "—"} đêm</dd></div>
        <div><dt>Khách / phòng</dt><dd>{stay.guests} khách · {stay.rooms} phòng</dd></div>
        <div><dt>Giá / phòng / đêm</dt><dd>{formatCurrency(room?.giaVndDem ?? null)}</dd></div>
      </dl>
      <div className="sh-hotel-total">
        <span>Tổng tham khảo</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      <p className="sh-hotel-caption">
        Giá phòng × {nights || "—"} đêm × {stay.rooms} phòng. Không tự thêm thuế/phí chưa có trong nguồn.{" "}
        {source === "demo" ? "Toàn bộ giá là giả định demo." : "Đơn giá lấy từ danh mục API, có thể là dữ liệu demo."}
      </p>
      {step > 1 && step < 4 && <button className="btn btn-outline" onClick={onEdit}>Sửa lịch và loại phòng</button>}
      <span className="sh-hotel-badge">Không cần thanh toán</span>
    </aside>
  );
}
