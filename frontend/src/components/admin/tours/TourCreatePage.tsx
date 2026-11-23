"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { useTourForm } from "@/hooks/useTourForm";
import { ApiError } from "@/lib/api-client";
import { TOUR_LIST_HREF, tourEditHref } from "@/lib/admin-tours";
import { createTour, getAdminLookups } from "@/services/admin-catalog";
import type { AdminLookups } from "@/types/admin";
import { useAdmin } from "../shell/AdminProvider";
import { TourInfoFields } from "./TourInfoFields";

const FORBIDDEN = 403;

export function TourCreatePage() {
  const { context } = useAdmin();
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Tour", href: TOUR_LIST_HREF }, { label: "Thêm tour" }]} />
        <h1>Thêm tour</h1>
        <p>Tour mới được lưu ở trạng thái bản nháp. Thêm lịch trình, ảnh và lịch khởi hành rồi mới đăng bán.</p>
      </div>
      {context.capabilities.manageCatalog ? <CreateTour /> : (
        <ErrorState backHref={TOUR_LIST_HREF} backLabel="Danh sách tour"
          error={new ApiError("Tài khoản của bạn không có quyền thêm tour.", FORBIDDEN)} />
      )}
    </main>
  );
}

function CreateTour() {
  const { state, retry } = useResource("admin:lookups", getAdminLookups);
  if (state.status === "loading") return <LoadingState label="Đang tải danh mục…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  return <CreateForm lookups={state.data} />;
}

function CreateForm({ lookups }: { lookups: AdminLookups }) {
  const router = useRouter();
  const { form, busy, formError, errorOf, change, submit } = useTourForm();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const created = await submit(event, createTour);
    if (created) router.push(tourEditHref(created.id));
  }

  return (
    <form className="adm-panel" noValidate aria-busy={busy} onSubmit={event => void onSubmit(event)}>
      <TourInfoFields form={form} lookups={lookups} errorOf={errorOf} onChange={change} />
      {formError && <p className="sh-error" role="alert">{formError}</p>}
      <div className="adm-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Tạo tour"}</button>
        <ButtonLink href={TOUR_LIST_HREF} variant="ghost">Hủy</ButtonLink>
      </div>
    </form>
  );
}
