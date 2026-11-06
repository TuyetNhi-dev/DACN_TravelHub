"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, normalizeSearch } from "@/lib/format";
import { vietnamToday, validateContact } from "@/lib/hotel-stay";
import { airports, flightBookingIssue, flightTotal, matchesFlight, validateFlightSearch } from "@/lib/flight-search";
import { demoFlights } from "@/data/flights-demo";
import { getFlights } from "@/services/flights";
import type { Flight, FlightSearch } from "@/types/flight";

type Resource = { status: "loading" } | { status: "error" } | { status: "ready"; rows: Flight[] };
const time = (value: string | null) => value?.slice(0, 5) || "Chưa có giờ";

function FlightSummary({ flight: f, detail = false }: { flight: Flight; detail?: boolean }) {
  return <>
    <div className="sf-airline"><span className="sf-airline-mark" aria-hidden="true">✈</span><div><b>{f.hangBayThamKhao || "Chưa có hãng bay"}</b><small>{f.soHieuDemo || f.flightId} · {f.hangVe || "Chưa có hạng vé"}</small></div></div>
    <div className="sf-timeline"><div><strong>{time(f.gioDi)}</strong><span>{f.maSanBayDi} · {f.noiDi}</span></div><div className="sf-duration"><small>{f.thoiGianPhut === null ? "Chưa có thời lượng" : `${f.thoiGianPhut} phút`}</small><span aria-hidden="true">──── ✈ ────</span><small>{f.ngayBay} · Giờ Việt Nam</small></div><div><strong>{time(f.gioDen)}</strong><span>{f.maSanBayDen} · {f.noiDen}</span></div></div>
    <div className="sf-price"><strong>{formatCurrency(f.giaVnd)}</strong><small>/ hành khách · giá tham khảo</small></div>
    {detail && <div className="sf-details"><p>Sân bay: {airports.find(a => a[0] === f.maSanBayDi)?.[2] || f.maSanBayDi} → {airports.find(a => a[0] === f.maSanBayDen)?.[2] || f.maSanBayDen}</p><p>Hành lý: chưa có dữ liệu. Điều kiện đổi/hủy: chưa có dữ liệu.</p><p>Ghế còn theo danh mục: {f.soGheCon ?? "Chưa có dữ liệu"}. Chưa kiểm tra tồn chỗ thực tế.</p>{f.ghiChu && <p>{f.ghiChu}</p>}{f.nguonThamKhao && <p>Nguồn tham khảo: {f.nguonThamKhao}</p>}</div>}
  </>;
}

export function FlightPage({ step, query }: { step: string; query: Record<string, string> }) {
  const router = useRouter();
  const source = query.source === "demo" ? "demo" : "api";
  const initial: FlightSearch = { from: query.from || "SGN", to: query.to || "HAN", departure: query.departure || "", returning: query.returning || "", roundTrip: query.roundTrip === "true", passengers: Number(query.passengers || 1), cabin: query.cabin || "Phổ thông" };
  const [search, setSearch] = useState(initial);
  const [resource, setResource] = useState<Resource>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [airline, setAirline] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [hour, setHour] = useState("");
  const [sort, setSort] = useState("price");
  const [outbound, setOutbound] = useState(query.outbound || "");
  const [inbound, setInbound] = useState(query.inbound || "");
  const [compared, setCompared] = useState<string[]>([]);
  const [bookingStep, setBookingStep] = useState(0);
  const [names, setNames] = useState<string[]>(Array.from({ length: Math.min(9, Math.max(1, initial.passengers || 1)) }, () => ""));
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const searchKey = JSON.stringify(initial);

  useEffect(() => {
    if (step === "search") return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const rows = source === "demo" ? demoFlights(JSON.parse(searchKey) as FlightSearch) : await getFlights(controller.signal);
        if (!controller.signal.aborted) setResource({ status: "ready", rows });
      } catch { if (!controller.signal.aborted) setResource({ status: "error" }); }
    };
    void load();
    return () => controller.abort();
  }, [source, attempt, step, searchKey]);
  useEffect(() => { if (step === "booking") heading.current?.focus(); }, [bookingStep, step]);

  const rows = resource.status === "ready" ? resource.rows : [];
  const selected = [rows.find(f => f.flightId === outbound), ...(initial.roundTrip ? [rows.find(f => f.flightId === inbound)] : [])].filter((f): f is Flight => Boolean(f));
  const searchIssue = validateFlightSearch(initial);
  const issue = flightBookingIssue(selected, initial);
  const total = flightTotal(selected, initial.passengers);
  const choosingReturn = initial.roundTrip && Boolean(outbound);
  const candidates = rows.filter(f => matchesFlight(f, initial, choosingReturn));
  const visible = candidates.filter(f => (!airline || f.hangBayThamKhao === airline)
    && (!minPrice || (f.giaVnd !== null && f.giaVnd >= Number(minPrice)))
    && (!maxPrice || (f.giaVnd !== null && f.giaVnd <= Number(maxPrice)))
    && (!hour || (f.gioDi !== null && Math.floor(Number(f.gioDi.slice(0, 2)) / 6) === Number(hour))));
  visible.sort((a, b) => sort === "departure" ? (a.gioDi || "99").localeCompare(b.gioDi || "99")
    : sort === "duration" ? (a.thoiGianPhut ?? Infinity) - (b.thoiGianPhut ?? Infinity)
    : a.giaVnd === null ? 1 : b.giaVnd === null ? -1 : sort === "high" ? b.giaVnd - a.giaVnd : a.giaVnd - b.giaVnd);

  function url(next: string, values: FlightSearch = initial, out = outbound, back = inbound, dataSource = source) {
    const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])), source: dataSource });
    if (out) params.set("outbound", out);
    if (back) params.set("inbound", back);
    return `/flights${next ? "/" + next : ""}?${params}`;
  }
  function submitSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problem = validateFlightSearch(search);
    setError(problem || "");
    if (!problem) router.push(url("results", search, "", ""));
  }
  function clearFilters() { setAirline(""); setMinPrice(""); setMaxPrice(""); setHour(""); setSort("price"); }
  function choose(f: Flight) {
    if (choosingReturn) router.push(url("detail", initial, outbound, f.flightId));
    else if (initial.roundTrip) { setOutbound(f.flightId); setCompared([]); clearFilters(); }
    else router.push(url("detail", initial, f.flightId, ""));
  }
  function nextBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problem = issue || (bookingStep === 0 ? names.some(n => n.trim().length < 2 || n.trim().length > 100) ? "Mỗi hành khách cần có họ tên từ 2 đến 100 ký tự." : validateContact(contact.name, contact.email, contact.phone) : !consent ? "Vui lòng xác nhận đây là trải nghiệm mô phỏng." : null);
    setError(problem || "");
    if (!problem) setBookingStep(bookingStep + 1);
  }

  return <main id="main-content" className="sf">
    <section className="sf-hero"><div className="container"><span className="kicker">SÀIHÀNH · VÉ MÁY BAY NỘI ĐỊA</span><h1>Chạm mây trời,<br /><em>mở lối hành trình.</em></h1><p>Tìm chuyến bay phù hợp cho những cuộc hẹn khắp Việt Nam.</p></div></section>
    <div className="container sf-body">
      <nav className="sf-crumb" aria-label="Đường dẫn"><Link href="/flights">Vé máy bay</Link>{step !== "search" && <><span>/</span><Link href={url("results", initial, "", "")}>Kết quả</Link></>}{["detail", "booking"].includes(step) && <><span>/</span><span>{step === "detail" ? "Chi tiết vé" : "Đặt vé demo"}</span></>}</nav>
      <aside className="sf-notice"><b>{source === "demo" ? "CHẾ ĐỘ DEMO" : "DANH MỤC API /api/flights"}</b><p>{source === "demo" ? "Lịch bay và giá hoàn toàn mô phỏng, không phải dữ liệu thời gian thực." : "Dữ liệu tham khảo từ hệ thống; chưa xác minh giá và tồn chỗ thời gian thực."} Chưa xuất vé, giữ chỗ hoặc thanh toán thật.</p><Link className="btn btn-outline" href={url(step === "search" ? "" : "results", search, "", "", source === "api" ? "demo" : "api")}>{source === "api" ? "Trải nghiệm dữ liệu demo" : "Dùng danh mục API"}</Link></aside>
      {["search", "results"].includes(step) && <form className="sf-panel sf-search" onSubmit={submitSearch}>
        <div className="sf-trip"><label><input type="radio" name="trip" checked={!search.roundTrip} onChange={() => setSearch({ ...search, roundTrip: false })} /> Một chiều</label><label><input type="radio" name="trip" checked={search.roundTrip} onChange={() => setSearch({ ...search, roundTrip: true })} /> Khứ hồi</label></div>
        {([ ["from", "Điểm đi"], ["to", "Điểm đến"] ] as const).map(([key, label]) => <label key={key}>{label}<input required list={`sf-${key}`} value={search[key]} onChange={e => setSearch({ ...search, [key]: e.target.value })} placeholder="Tên thành phố hoặc mã sân bay" maxLength={100} />{search[key] && !airports.some(a => a[0] === search[key]) && <div className="sf-airport-options" aria-label={`Gợi ý ${label.toLowerCase()}`}>{airports.filter(a => a.some(v => normalizeSearch(v).includes(normalizeSearch(search[key])))).map(a => <button key={a[0]} type="button" onClick={() => setSearch({ ...search, [key]: a[0] })}>{a[1]} · {a[0]} · {a[2]}</button>)}</div>}<datalist id={`sf-${key}`}>{airports.filter(a => a.some(v => normalizeSearch(v).includes(normalizeSearch(search[key]))) || !search[key]).map(a => <option key={a[0]} value={a[0]}>{a[1]} · {a[2]}</option>)}</datalist></label>)}
        <button type="button" className="btn btn-outline sf-swap" aria-label="Đổi điểm đi và đến" onClick={() => setSearch({ ...search, from: search.to, to: search.from })}>⇄</button>
        <label>Ngày đi<input required type="date" min={vietnamToday()} value={search.departure} onChange={e => setSearch({ ...search, departure: e.target.value })} /></label>
        {search.roundTrip && <label>Ngày về<input required type="date" min={search.departure || vietnamToday()} value={search.returning} onChange={e => setSearch({ ...search, returning: e.target.value })} /></label>}
        <label>Hành khách<select value={search.passengers} onChange={e => setSearch({ ...search, passengers: Number(e.target.value) })}>{Array.from({ length: 9 }, (_, i) => <option key={i} value={i + 1}>{i + 1} hành khách</option>)}</select></label>
        <label>Hạng vé<select value={search.cabin} onChange={e => setSearch({ ...search, cabin: e.target.value })}><option>Phổ thông</option><option>Thương gia</option></select></label>
        <button className="btn btn-primary">Tìm chuyến bay →</button><p className="sf-wide sf-muted">Hỗ trợ tên có dấu, không dấu và mã sân bay. Demo hiện dùng cùng mức giá cho mỗi hành khách, chưa phân loại trẻ em/em bé.</p>
      </form>}
      {error && <p role="alert" className="sf-error">{error}</p>}
      {step === "search" && <section className="sf-intro"><span aria-hidden="true">✈</span><div><h2>Hành trình bắt đầu từ một lựa chọn.</h2><p>Tìm chuyến bay nội địa, so sánh các lựa chọn và xem lại thông tin trước khi trải nghiệm đặt vé demo.</p></div><div><b>01 · Tìm chuyến</b><p>Chọn hành trình và ngày bay.</p><b>02 · So sánh & chọn</b><p>Xem giờ, giá và hạng vé.</p><b>03 · Đặt vé demo</b><p>Nhập thông tin, xem lại và mô phỏng.</p></div></section>}
      {step !== "search" && (searchIssue ? <div className="sf-panel" role="alert"><p>{searchIssue}</p><Link href="/flights" className="btn btn-primary">Sửa tìm kiếm</Link></div> : resource.status === "loading" ? <div className="sf-panel sf-loading" role="status">Đang tải danh mục chuyến bay…<div /><div /><div /></div> : resource.status === "error" ? <div className="sf-panel" role="alert"><h2>Chưa tải được chuyến bay</h2><p>Không thể đọc danh mục API. Kiểm tra kết nối hoặc cấu hình API rồi thử lại.</p><button className="btn btn-primary" onClick={() => { setResource({ status: "loading" }); setAttempt(attempt + 1); }}>Thử lại</button></div> : <>
        {step === "results" && <>
          <div className="sf-results-title"><div><span className="kicker">{choosingReturn ? "BƯỚC 2 · CHỌN CHUYẾN VỀ" : "BƯỚC 1 · CHỌN CHUYẾN ĐI"}</span><h2>{choosingReturn ? initial.to + " → " + initial.from : initial.from + " → " + initial.to}</h2><p>{visible.length} lựa chọn · {initial.passengers} hành khách · {initial.cabin}</p></div>{choosingReturn && <button className="btn btn-outline" onClick={() => { setOutbound(""); setInbound(""); setCompared([]); clearFilters(); }}>Chọn lại chuyến đi</button>}</div>
          {choosingReturn && selected[0] && <div className="sf-panel sf-selected"><b>Chuyến đi đã chọn</b><FlightSummary flight={selected[0]} /></div>}
          <div className="sf-layout"><aside className="sf-panel sf-filters"><h3>Bộ lọc chuyến bay</h3><label>Hãng hàng không<select value={airline} onChange={e => setAirline(e.target.value)}><option value="">Tất cả hãng</option>{[...new Set(candidates.map(f => f.hangBayThamKhao).filter((a): a is string => Boolean(a)))].map(a => <option key={a}>{a}</option>)}</select></label><label>Giá từ (đ/người)<input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} /></label><label>Giá đến (đ/người)<input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></label><label>Giờ khởi hành<select value={hour} onChange={e => setHour(e.target.value)}><option value="">Cả ngày</option>{["00:00–05:59", "06:00–11:59", "12:00–17:59", "18:00–23:59"].map((h, i) => <option key={h} value={i}>{h}</option>)}</select></label><button className="btn btn-outline" onClick={clearFilters}>Xóa bộ lọc</button></aside>
          <section className="sf-results"><label className="sf-sort">Sắp xếp<select value={sort} onChange={e => setSort(e.target.value)}><option value="price">Giá thấp nhất</option><option value="high">Giá cao nhất</option><option value="departure">Khởi hành sớm nhất</option><option value="duration">Thời gian bay ngắn nhất</option></select></label>
            {!visible.length && <div className="sf-panel"><h3>Không có chuyến bay phù hợp</h3><p>Thử ngày khác, hạng vé khác hoặc xóa bộ lọc. Dữ liệu API được giữ nguyên theo ngày trong danh mục.</p><button className="btn btn-outline" onClick={clearFilters}>Xóa bộ lọc</button></div>}
            {visible.map(f => <article className="sf-panel sf-card" key={f.flightId}><FlightSummary flight={f} /><div className="sf-card-actions"><label><input type="checkbox" checked={compared.includes(f.flightId)} disabled={compared.length >= 3 && !compared.includes(f.flightId)} onChange={e => setCompared(e.target.checked ? [...compared, f.flightId] : compared.filter(id => id !== f.flightId))} /> So sánh (tối đa 3)</label><button className="btn btn-primary" disabled={f.giaVnd === null || (f.soGheCon !== null && f.soGheCon < initial.passengers)} onClick={() => choose(f)}>{f.soGheCon !== null && f.soGheCon < initial.passengers ? "Không đủ ghế" : f.giaVnd === null ? "Chưa có giá" : "Chọn chuyến"}</button></div></article>)}
          </section></div>
          {compared.length > 0 && <section className="sf-panel sf-comparison"><h2>So sánh chuyến bay</h2><div className="sf-table-scroll"><table><caption>Giá tham khảo cho một hành khách, cùng chặng đang chọn</caption><thead><tr><th>Tiêu chí</th>{rows.filter(f => compared.includes(f.flightId)).map(f => <th key={f.flightId}>{f.hangBayThamKhao}<br />{f.soHieuDemo || f.flightId}</th>)}</tr></thead><tbody>{[ ["Khởi hành", (f: Flight) => time(f.gioDi)], ["Đến", (f: Flight) => time(f.gioDen)], ["Thời gian bay", (f: Flight) => f.thoiGianPhut === null ? "Chưa có" : `${f.thoiGianPhut} phút`], ["Hạng vé", (f: Flight) => f.hangVe], ["Giá tham khảo", (f: Flight) => formatCurrency(f.giaVnd)] ].map(([label, render]) => <tr key={String(label)}><th>{String(label)}</th>{rows.filter(f => compared.includes(f.flightId)).map(f => <td key={f.flightId}>{typeof render === "function" ? render(f) : ""}</td>)}</tr>)}</tbody></table></div><button className="btn btn-outline" onClick={() => setCompared([])}>Xóa so sánh</button></section>}
        </>}
        {["detail", "booking"].includes(step) && (issue ? <div className="sf-panel" role="alert"><h2>Chưa thể tiếp tục</h2><p>{issue}</p><Link className="btn btn-primary" href={url("results", initial, "", "")}>Chọn lại chuyến bay</Link></div> : <div className="sf-booking-layout"><section>
          {step === "detail" ? <><h2>Chi tiết hành trình & hạng vé</h2>{selected.map((f, i) => <article className="sf-panel sf-card" key={f.flightId}><h3 className="sf-wide">{i ? "Chuyến về" : "Chuyến đi"}</h3><FlightSummary flight={f} detail /></article>)}<Link className="btn btn-outline" href={url("results", initial, "", "")}>Chọn lại chuyến bay</Link></> : <>
            <h2 ref={heading} tabIndex={-1}>{["Thông tin hành khách", "Xem lại đặt vé demo", "Hoàn thành mô phỏng"][bookingStep]}</h2><ol className="sf-steps">{["Thông tin", "Xem lại", "Kết quả"].map((s, i) => <li key={s} aria-current={bookingStep === i ? "step" : undefined}>{i + 1}. {s}</li>)}</ol>
            {bookingStep < 2 ? <form className="sf-panel" onSubmit={nextBooking}>
              {bookingStep === 0 ? <><p>Chỉ cần thông tin liên hệ cho demo; không nhập giấy tờ định danh hay thông tin thanh toán.</p>{names.map((name, i) => <label className="sf-field" key={i}>Họ tên hành khách {i + 1}<input required minLength={2} maxLength={100} autoComplete="off" value={name} onChange={e => setNames(names.map((n, j) => i === j ? e.target.value : n))} /></label>)}<h3>Thông tin liên hệ</h3>{([ ["name", "Họ tên", "text"], ["email", "Email", "email"], ["phone", "Số điện thoại", "tel"] ] as const).map(([key, label, type]) => <label className="sf-field" key={key}>{label}<input required type={type} maxLength={key === "email" ? 200 : key === "phone" ? 20 : 100} value={contact[key]} onChange={e => setContact({ ...contact, [key]: e.target.value })} /></label>)}</> : <><h3>Hành khách</h3>{names.map((n, i) => <p key={i}>{i + 1}. {n.trim()}</p>)}<h3>Liên hệ</h3><p>{contact.name}<br />{contact.email}<br />{contact.phone}</p>{selected.map(f => <article className="sf-review" key={f.flightId}><FlightSummary flight={f} /></article>)}<p><b>Tổng dự kiến: {formatCurrency(total)}</b></p><label className="sf-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> Tôi hiểu đây là mô phỏng, chưa xuất vé, giữ chỗ hay thanh toán thật.</label></>}
              <div className="sf-actions">{bookingStep === 1 ? <button type="button" className="btn btn-outline" onClick={() => { setBookingStep(0); setError(""); }}>Chỉnh sửa thông tin</button> : <Link className="btn btn-outline" href={url("detail")}>Quay lại hành trình</Link>}<button className="btn btn-primary">{bookingStep === 0 ? "Xem lại thông tin" : "Hoàn tất mô phỏng"}</button></div>
            </form> : <div className="sf-panel sf-success"><span aria-hidden="true">✓</span><h3>Đã hoàn thành trải nghiệm demo</h3><p>Chưa xuất vé, chưa giữ chỗ và không phát sinh thanh toán. Thông tin chỉ nằm trong bộ nhớ phiên trang, không gửi đến backend và không lưu vào localStorage.</p><p>{selected.map(f => `${f.maSanBayDi} → ${f.maSanBayDen} (${f.ngayBay})`).join(" · ")}</p><p>Tổng mô phỏng: <b>{formatCurrency(total)}</b></p><Link href="/flights" className="btn btn-primary">Tìm hành trình mới</Link></div>}
          </>}
        </section><aside className="sf-panel sf-total"><span className="kicker">TỔNG DỰ KIẾN</span><h2>{formatCurrency(total)}</h2>{selected.map((f, i) => <p key={f.flightId}>{i ? "Chặng về" : "Chặng đi"}: {formatCurrency(f.giaVnd)} × {initial.passengers} hành khách</p>)}<hr /><p>Thuế, phí bổ sung: chưa có dữ liệu. Tổng trên chỉ là tổng giá trong danh mục, chưa xác nhận gồm thuế/phí.</p><p>Không phải báo giá thời gian thực.</p>{step === "detail" && <Link className="btn btn-primary" href={url("booking")}>Tiếp tục đặt vé demo</Link>}</aside></div>)}
      </>)}
    </div>
  </main>;
}
