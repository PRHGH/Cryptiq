"use client";

import { useState } from "react";
import { useDebounce } from "react-use";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useEffect } from "react";

type CoinsSearchInputProps = {
  initialQuery: string;
};

const CoinsSearchInput = ({ initialQuery }: CoinsSearchInputProps) => {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    queueMicrotask(() => setValue(initialQuery));
  }, [initialQuery]);

  useDebounce(
    () => {
      const trimmedValue = value.trim();
      const params = new URLSearchParams(searchParams.toString());

      if (trimmedValue) {
        params.set("q", trimmedValue);
        params.delete("page");
      } else {
        params.delete("q");
      }

      const nextQueryString = params.toString();
      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      const currentQueryString = searchParams.toString();
      const currentUrl = currentQueryString ? `${pathname}?${currentQueryString}` : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl);
      }
    },
    350,
    [value, pathname, router, searchParams],
  );

  return (
    <Input
      className="coins-search-input"
      placeholder="Search for a token"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
};

export default CoinsSearchInput;
