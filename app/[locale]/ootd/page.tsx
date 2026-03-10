import { OotdCalendar } from "@/components/ootd/ootd-calendar";
import { OotdDaySelectionSync } from "@/components/ootd/ootd-day-selection-sync";
import { getDictionary } from "@/features/i18n/get-dictionary";
import { getOotdRecords } from "@/features/ootd/api";
import type { Locale } from "@/features/i18n/routing";

export default async function OotdPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { locale } = await params;
  const { month, day } = await searchParams;
  const dict = await getDictionary(locale);
  const records = await getOotdRecords(locale);

  return (
    <div className="min-w-0 lg:h-full">
      <OotdDaySelectionSync />
      <OotdCalendar
        locale={locale}
        month={month}
        selectedDay={day}
        records={records.data}
        labels={{ ...dict.ootd.calendar, ...dict.ootd.detail }}
      />
    </div>
  );
}
