import { Icon } from "@/components/ui/Icon";
import { promises } from "@/data/home";

export function HomePromises() {
  return (
    <ul className="promise-grid">
      {promises.map(item => (
        <li key={item.title} className="promise" data-reveal-item>
          <span className="promise-icon"><Icon name={item.icon} size={22} /></span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}
