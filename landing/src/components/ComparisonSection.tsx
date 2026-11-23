import { Check, Minus } from "lucide-react";
import { Reveal, SectionHeading } from "./ui/primitives";

const rows: { label: string; ours: string | boolean; homegrown: string | boolean; legacy: string | boolean }[] = [
  { label: "Password hashing", ours: "Argon2id memory-hard", homegrown: "Your choice", legacy: "Often bcrypt" },
  { label: "Second factor before session", ours: true, homegrown: "Build and operate", legacy: "Add-on module" },
  { label: "Opaque, hash-only token storage", ours: true, homegrown: "Custom design", legacy: "Varies" },
  { label: "Admin session kill-switch", ours: true, homegrown: "Custom invalidation", legacy: "Limited control" },
  { label: "3-strike automated lockout", ours: true, homegrown: "Manual implementation", legacy: "Policy add-on" },
  { label: "RS256 + JWKS + PKCE", ours: true, homegrown: "DIY or library glue", legacy: true },
  { label: "Inspectable discovery document", ours: true, homegrown: false, legacy: true },
  { label: "Audit trail with IP attribution", ours: true, homegrown: "Your logging stack", legacy: "Enterprise tier" },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#F07A26]/15 text-[#F07A26]"><Check className="h-3.5 w-3.5" /></span>;
  if (value === false) return <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04] text-slate-600"><Minus className="h-3.5 w-3.5" /></span>;
  return <span className="block break-words text-[11px] leading-4 text-[#94A3B8] sm:text-[13px] sm:leading-5">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section id="compare" className="scroll-mt-24 border-y border-[#1E2838] bg-white/[0.012] py-24 sm:py-28">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="The honest comparison"
            title="Know exactly what you're running"
            description="We compare against generic alternatives rather than named vendors — the point is the architecture, not the logo."
          />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-14 rounded-xl border border-[#1E2838] bg-[#0E1420]">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#1E2838]">
                  <th className="px-3 py-4 text-[11px] font-medium text-slate-500 sm:px-6 sm:py-5 sm:text-[13px]">Capability</th>
                  <th className="bg-[#F07A26]/[0.06] px-2 py-4 text-center sm:px-6 sm:py-5">
                    <span className="block font-display text-[12px] font-bold text-white sm:text-[15px]">VaultAuth</span>
                    <span className="mt-1 hidden rounded bg-[#F07A26]/15 px-2 py-0.5 text-[10px] text-[#F07A26] sm:inline-block">This platform</span>
                  </th>
                  <th className="px-2 py-4 text-center font-display text-[12px] font-semibold text-[#94A3B8] sm:px-6 sm:py-5 sm:text-[15px]">Homegrown auth</th>
                  <th className="px-2 py-4 text-center font-display text-[12px] font-semibold text-[#94A3B8] sm:px-6 sm:py-5 sm:text-[15px]">Legacy IdP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-white/[0.05] last:border-0">
                    <td className="break-words px-3 py-3 text-[11px] leading-5 text-white sm:px-6 sm:py-4 sm:text-[13px]">{row.label}</td>
                    <td className="bg-[#F07A26]/[0.03] px-2 py-3 text-center sm:px-6 sm:py-4"><Cell value={row.ours} /></td>
                    <td className="px-2 py-3 text-center sm:px-6 sm:py-4"><Cell value={row.homegrown} /></td>
                    <td className="px-2 py-3 text-center sm:px-6 sm:py-4"><Cell value={row.legacy} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
