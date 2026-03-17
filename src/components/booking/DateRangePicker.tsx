import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  isDateBlocked?: (date: Date) => boolean;
  minimumNights?: number;
  maximumNights?: number;
}

const MONTH_NAMES = {
  EN: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  RO: [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
  ],
};

const DAY_NAMES = {
  EN: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  RO: ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'],
};

export default function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  isDateBlocked = () => false,
  minimumNights = 1,
}: DateRangePickerProps) {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const monthNames = MONTH_NAMES[language];
  const dayNames = DAY_NAMES[language];

  useEffect(() => {
    if (checkIn && !checkOut) {
      setSelectingCheckOut(true);
    }
  }, [checkIn, checkOut]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date: Date) => {
    if (checkIn && date.getTime() === checkIn.getTime()) return true;
    if (checkOut && date.getTime() === checkOut.getTime()) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };

  const isTooSoon = useCallback(
    (date: Date) => {
      if (!checkIn || !selectingCheckOut) return false;
      const minDate = new Date(checkIn);
      minDate.setDate(minDate.getDate() + minimumNights);
      return date < minDate;
    },
    [checkIn, selectingCheckOut, minimumNights]
  );

  const handleDateClick = (displayMonth: Date, day: number) => {
    const clickedDate = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day
    );
    clickedDate.setHours(0, 0, 0, 0);

    if (isPast(clickedDate) || isDateBlocked(clickedDate)) return;

    if (!checkIn || (checkIn && checkOut) || clickedDate < checkIn) {
      onCheckInChange(clickedDate);
      onCheckOutChange(null);
      setSelectingCheckOut(true);
    } else if (selectingCheckOut && clickedDate > checkIn) {
      if (isTooSoon(clickedDate)) return;

      let hasBlockedDate = false;
      const current = new Date(checkIn);
      current.setDate(current.getDate() + 1);
      while (current < clickedDate) {
        if (isDateBlocked(current)) {
          hasBlockedDate = true;
          break;
        }
        current.setDate(current.getDate() + 1);
      }

      if (!hasBlockedDate) {
        onCheckOutChange(clickedDate);
        setSelectingCheckOut(false);
      }
    }
  };

  const goToPreviousMonth = () => {
    const today = new Date();
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    if (prevMonth.getMonth() >= today.getMonth() || prevMonth.getFullYear() > today.getFullYear()) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const clearDates = () => {
    onCheckInChange(null);
    onCheckOutChange(null);
    setSelectingCheckOut(false);
  };

  const renderCalendar = (monthOffset: number) => {
    const displayMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + monthOffset
    );
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDay = getFirstDayOfMonth(displayMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);

      const blocked = isDateBlocked(date);
      const past = isPast(date);
      const selected = isSelected(date);
      const inRange = isInRange(date);
      const today = isToday(date);
      const tooSoon = isTooSoon(date);
      const disabled = blocked || past || tooSoon;

      let className =
        'aspect-square flex items-center justify-center rounded-full text-sm transition-all ';

      if (disabled) {
        className += 'text-gray-300 cursor-not-allowed ';
        if (blocked && !past) {
          className += 'bg-gray-100 line-through ';
        }
      } else if (selected) {
        className += 'bg-primary text-white font-semibold cursor-pointer ';
      } else if (inRange) {
        className += 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 ';
      } else if (today) {
        className += 'border-2 border-primary text-primary cursor-pointer hover:bg-primary/10 ';
      } else {
        className += 'text-gray-700 cursor-pointer hover:bg-gray-100 ';
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(displayMonth, day)}
          disabled={disabled}
          className={className}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="w-full">
        <div className="text-center font-semibold text-gray-900 mb-3 text-sm">
          {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="aspect-square flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">{days}</div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        {(checkIn || checkOut) && (
          <button
            onClick={clearDates}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="w-3 h-3" />
            {language === 'EN' ? 'Clear' : 'Șterge'}
          </button>
        )}
        <button
          onClick={goToNextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        {renderCalendar(0)}
        <div className="border-t border-gray-100 pt-4">
          {renderCalendar(1)}
        </div>
      </div>

      {selectingCheckOut && checkIn && (
        <div className="mt-3 text-center text-xs text-gray-500">
          {language === 'EN'
            ? `Select check-out (min. ${minimumNights} night${minimumNights > 1 ? 's' : ''})`
            : `Selectați check-out (min. ${minimumNights} ${minimumNights > 1 ? 'nopți' : 'noapte'})`}
        </div>
      )}
    </div>
  );
}
