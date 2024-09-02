import { createWebHistory, createRouter } from "vue-router";

function getAbsolutePath() {
  const path = location.pathname;
  return path.substring(0, path.lastIndexOf("/") + 1);
}

const router = createRouter({
  history: createWebHistory(getAbsolutePath()),
  routes: [
    {
      path: "/",
      name: "index",
      redirect: "/home",
    },
    {
      path: "/",
      component: () => import("../layout/StyleLayout.vue"),
      children: [
        {
          path: "home",
          name: "home",
          component: () => import("../pages/home.vue"),
        },
      ],
    },
  ],
});

export default router;
