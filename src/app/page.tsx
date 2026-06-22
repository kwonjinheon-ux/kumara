import { getCurrentUser } from "@/lib/current-user";
import { HomePageView } from "@/views/HomePage/HomePage";

// Route layer prepares server data and delegates rendering to the View.
export default async function HomePage() {
  const user = await getCurrentUser();
  return <HomePageView user={user} />;
}
