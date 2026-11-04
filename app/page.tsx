"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        <div className="mb-12">
          <div className="mx-auto mb-5 h-16 w-16 rounded-[22px] bg-[#E6A6B8] shadow-[0_12px_30px_rgba(230,166,184,.35)] flex items-center justify-center text-white text-2xl font-black">CH</div>
          <p className="text-xs tracking-[0.32em] text-[#999] mb-2">LOVE ALL</p>
          <h1 className="text-4xl font-black tracking-[0.08em] text-[#252525]">COLOR HUNT</h1>
        </div>
        <div className="grid gap-3">
          <Link href="/team-login" className="rounded-2xl bg-[#252525] px-5 py-4 text-white font-bold no-underline shadow-[0_10px_25px_rgba(0,0,0,.12)]">チームで参加</Link>
          <Link href="/admin-login" className="rounded-2xl border border-[#e7e7e7] bg-white px-5 py-4 text-[#555] font-bold no-underline">運営者ログイン</Link>
        </div>
      </section>
    </main>
  );
}
