import { Icon } from "@/components/ui/Icon";
import Form from "next/form";

export function HeaderSearch() {
  return <Form action="/tours" role="search" aria-label="Tìm tour trên SàiHành" className="header-search">
    <input name="q" type="search" aria-label="Tên tour hoặc điểm đến" placeholder="Tìm tour, điểm đến…" maxLength={200} />
    <button type="submit" aria-label="Tìm kiếm tour" title="Tìm kiếm tour"><Icon name="search" size={18} /></button>
  </Form>;
}
