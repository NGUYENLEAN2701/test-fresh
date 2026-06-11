import { define } from "../utils.ts";
import HomeController from "../islands/HomeController.tsx";

export default define.page(function Home() {
  return (
    <div class="fresh-gradient min-h-screen">
      <HomeController />
    </div>
  );
});
