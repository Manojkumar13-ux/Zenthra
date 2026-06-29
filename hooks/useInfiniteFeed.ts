import { useInfiniteQuery } from "@tanstack/react-query";

export function useInfiniteFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/posts?page=${pageParam}&limit=10`);
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}
