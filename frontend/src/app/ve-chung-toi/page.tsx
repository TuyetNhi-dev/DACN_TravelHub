import { ContentPage } from "@/components/content/ContentPage";
import { PROJECT_TEAM, aboutPage } from "@/data/about";

export const metadata = { title: "Về chúng tôi | SàiHành" };

export default function AboutPage() {
  return (
    <ContentPage document={aboutPage}>
      <section className="content-team" aria-label="Thành viên nhóm">
        {PROJECT_TEAM.members.length > 0
          ? <ul>{PROJECT_TEAM.members.map(name => <li key={name}>{name}</li>)}</ul>
          : <p>Danh sách tên thành viên sẽ được nhóm cập nhật.</p>}
      </section>
    </ContentPage>
  );
}
