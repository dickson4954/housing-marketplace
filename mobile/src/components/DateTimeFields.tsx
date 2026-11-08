import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react-native';

const C = {
  background: '#0B0F10',
  card: '#14191B',
  lime: '#D7FF5F',
  text: '#F4F7F2',
  muted: '#9CA5A7',
  border: '#252C2E',
};

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string;
  disabled?: boolean;
};

type TimePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumTime?: string;
  disabled?: boolean;
};

export function getLocalDateString(offsetDays = 0): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function addDaysToDate(value: string, days: number): string {
  const parts = value.split('-').map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return getLocalDateString();
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function displayDate(value: string): string {
  if (!isValidDateString(value)) return 'Select a date';

  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day, 12).toLocaleDateString(
    'en-KE',
    { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
  );
}

type MonthYearGridProps = {
  year: number;
  selectedMonth: number;
  minimumDate: string;
  onYearChange: (year: number) => void;
  onSelectMonth: (month: number) => void;
};

function MonthYearGrid({
  year,
  selectedMonth,
  minimumDate,
  onYearChange,
  onSelectMonth,
}: MonthYearGridProps) {
  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
  ];

  const minimumYear = Number(minimumDate.slice(0, 4));
  const minimumMonth = Number(minimumDate.slice(5, 7)) - 1;

  return (
    <View style={styles.monthYearPanel}>
      <View style={styles.yearControls}>
        <Pressable
          disabled={year <= minimumYear}
          onPress={() => onYearChange(year - 1)}
          style={styles.monthButton}
        >
          <ChevronLeft
            color={year <= minimumYear ? C.border : C.text}
            size={20}
          />
        </Pressable>

        <Text style={styles.yearText}>{year}</Text>

        <Pressable
          disabled={year >= 2100}
          onPress={() => onYearChange(year + 1)}
          style={styles.monthButton}
        >
          <ChevronRight
            color={year >= 2100 ? C.border : C.text}
            size={20}
          />
        </Pressable>
      </View>

      <View style={styles.monthChoices}>
        {monthNames.map((name, index) => {
          const unavailable =
            year < minimumYear ||
            (year === minimumYear && index < minimumMonth);
          const selected = index === selectedMonth;

          return (
            <Pressable
              key={name}
              disabled={unavailable}
              onPress={() => onSelectMonth(index)}
              style={[
                styles.monthChoice,
                selected && styles.monthChoiceSelected,
                unavailable && styles.monthChoiceDisabled,
              ]}
            >
              <Text
                style={[
                  styles.monthChoiceText,
                  selected && styles.monthChoiceTextSelected,
                  unavailable && styles.monthChoiceTextDisabled,
                ]}
              >
                {name.slice(0, 3)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate = getLocalDateString(),
  disabled = false,
}: DatePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const initial = (
    isValidDateString(value) && value >= minimumDate
  ) ? value : minimumDate;

  const [monthDate, setMonthDate] = useState(() => {
    const [year, month, day] = initial.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  });

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const cells = useMemo(() => {
    const offset = new Date(year, month, 1, 12).getDay();
    const count = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: offset }, (_, index) => ({
        key: `blank-${index}`,
        dateKey: '',
        day: 0,
      })),
      ...Array.from({ length: count }, (_, index) => {
        const day = index + 1;
        const dateKey =
          `${year}-${String(month + 1).padStart(2, '0')}-` +
          String(day).padStart(2, '0');

        return { key: dateKey, dateKey, day };
      }),
    ];
  }, [year, month]);

  const changeMonth = (direction: number) => {
    setMonthDate(new Date(year, month + direction, 1, 12));
  };

  const minimumMonth = minimumDate.slice(0, 7);
  const currentMonth =
    `${year}-${String(month + 1).padStart(2, '0')}`;

  const previousDisabled = currentMonth <= minimumMonth;

  const openCalendar = () => {
    const selected = (
      isValidDateString(value) && value >= minimumDate
    ) ? value : minimumDate;

    const [selectedYear, selectedMonth, selectedDay] =
      selected.split('-').map(Number);

    setMonthDate(
      new Date(selectedYear, selectedMonth - 1, selectedDay, 12)
    );
    setPickerYear(selectedYear);
    setShowMonthYearPicker(false);
    setVisible(true);
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={openCalendar}
        style={[styles.field, disabled && styles.disabled]}
      >
        <CalendarDays color={C.lime} size={20} />

        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? displayDate(value) : 'Choose date'}
        </Text>

        <ChevronRight color={C.muted} size={19} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose a date</Text>
                <Text style={styles.calendarHint}>
                  Select your preferred day.
                </Text>
              </View>

              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.monthHeader}>
              <Pressable
                disabled={previousDisabled}
                onPress={() => changeMonth(-1)}
                style={styles.monthButton}
              >
                <ChevronLeft
                  color={previousDisabled ? C.border : C.text}
                  size={22}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  setPickerYear(year);
                  setShowMonthYearPicker(current => !current);
                }}
                style={styles.monthTitleButton}
              >
                <Text style={styles.monthTitle}>
                  {monthDate.toLocaleDateString('en-KE', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <ChevronRight
                  color={C.lime}
                  size={16}
                  style={{ transform: [{ rotate: '90deg' }] }}
                />
              </Pressable>

              <Pressable
                onPress={() => changeMonth(1)}
                style={styles.monthButton}
              >
                <ChevronRight color={C.text} size={22} />
              </Pressable>
            </View>

            {showMonthYearPicker ? (
              <MonthYearGrid
                year={pickerYear}
                selectedMonth={month}
                minimumDate={minimumDate}
                onYearChange={setPickerYear}
                onSelectMonth={selectedMonth => {
                  setMonthDate(new Date(pickerYear, selectedMonth, 1, 12));
                  setShowMonthYearPicker(false);
                }}
              />
            ) : (
              <>
                <View style={styles.calendarGrid}>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <View key={day} style={styles.dayCell}>
                      <Text style={styles.weekday}>{day}</Text>
                    </View>
                  ))}

                  {cells.map(cell => {
                    if (!cell.dateKey) {
                      return <View key={cell.key} style={styles.dayCell} />;
                    }

                    const isPast = cell.dateKey < minimumDate;
                    const selected = cell.dateKey === value;

                    return (
                      <View key={cell.key} style={styles.dayCell}>
                        <Pressable
                          disabled={isPast}
                          onPress={() => {
                            onChange(cell.dateKey);
                            setVisible(false);
                          }}
                          style={[
                            styles.dayButton,
                            selected && styles.selectedDay,
                            isPast && styles.pastDay,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              selected && styles.selectedDayText,
                              isPast && styles.pastDayText,
                            ]}
                          >
                            {cell.day}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.calendarHint}>
              Dates before {displayDate(minimumDate)} cannot be selected.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}


type StayDateRangePickerProps = {
  checkInDate: string;
  checkOutDate: string;
  onChange: (checkIn: string, checkOut: string) => void;
  minimumDate?: string;
  disabled?: boolean;
  rangeEnabled?: boolean;
};

export function StayDateRangePicker({
  checkInDate,
  checkOutDate,
  onChange,
  minimumDate = getLocalDateString(),
  disabled = false,
  rangeEnabled = true,
}: StayDateRangePickerProps) {
  const [visible, setVisible] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const initialDate =
    isValidDateString(checkInDate) && checkInDate >= minimumDate
      ? checkInDate : minimumDate;

  const [monthDate, setMonthDate] = useState(() => {
    const [y, m, d] = initialDate.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  });

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const cells = useMemo(() => {
    const offset = new Date(year, month, 1, 12).getDay();
    const count = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: offset }, (_, i) => ({
        key: `blank-${i}`, dateKey: '', day: 0,
      })),
      ...Array.from({ length: count }, (_, i) => {
        const day = i + 1;
        const dateKey =
          `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { key: dateKey, dateKey, day };
      }),
    ];
  }, [year, month]);

  const currentMonth =
    `${year}-${String(month + 1).padStart(2, '0')}`;

  const previousDisabled = currentMonth <= minimumDate.slice(0, 7);

  const nights = useMemo(() => {
    if (!isValidDateString(checkInDate) ||
        !isValidDateString(checkOutDate)) return 0;

    const [sy, sm, sd] = checkInDate.split('-').map(Number);
    const [ey, em, ed] = checkOutDate.split('-').map(Number);

    return Math.max(0, Math.round(
      (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000
    ));
  }, [checkInDate, checkOutDate]);

  const openCalendar = (chooseEnd = false) => {
    const focus = chooseEnd && isValidDateString(checkOutDate)
      ? checkOutDate
      : isValidDateString(checkInDate) ? checkInDate : minimumDate;

    const [y, m, d] = focus.split('-').map(Number);
    setMonthDate(new Date(y, m - 1, d, 12));
    setSelectingEnd(chooseEnd && isValidDateString(checkInDate));
    setPickerYear(y);
    setShowMonthYearPicker(false);
    setVisible(true);
  };

  const chooseDate = (dateKey: string) => {
    if (!dateKey || dateKey < minimumDate) return;

    if (!rangeEnabled) {
      onChange(dateKey, '');
      setVisible(false);
      return;
    }

    if (!selectingEnd) {
      onChange(dateKey, '');
      setSelectingEnd(true);
      return;
    }

    if (!isValidDateString(checkInDate) || dateKey <= checkInDate) {
      onChange(dateKey, '');
      setSelectingEnd(true);
      return;
    }

    onChange(checkInDate, dateKey);
    setVisible(false);
  };

  return (
    <>
      <View style={styles.rangeSection}>
        <View style={styles.rangeHeading}>
          <View>
            <Text style={styles.rangeTitle}>Your dates</Text>
            <Text style={styles.rangeSubtitle}>
              {rangeEnabled
                ? 'Choose when you arrive and leave'
                : 'Choose your booking date'}
            </Text>
          </View>
          <CalendarDays color={C.lime} size={21} />
        </View>

        <View style={styles.rangeFields}>
          <Pressable
            disabled={disabled}
            onPress={() => openCalendar(false)}
            style={[styles.rangeDateCard, disabled && styles.disabled]}
          >
            <Text style={styles.rangeDateLabel}>CHECK-IN</Text>
            <Text style={styles.rangeDateValue}>
              {isValidDateString(checkInDate)
                ? displayDate(checkInDate) : 'Add arrival'}
            </Text>
            <Text style={styles.rangeDateCaption}>Arrival date</Text>
          </Pressable>

          {rangeEnabled && (
            <Pressable
              disabled={disabled}
              onPress={() => openCalendar(true)}
              style={[styles.rangeDateCard, disabled && styles.disabled]}
            >
              <Text style={styles.rangeDateLabel}>CHECK-OUT</Text>
              <Text style={styles.rangeDateValue}>
                {isValidDateString(checkOutDate)
                  ? displayDate(checkOutDate) : 'Add departure'}
              </Text>
              <Text style={styles.rangeDateCaption}>Departure date</Text>
            </Pressable>
          )}
        </View>

        {rangeEnabled && (
          <View style={styles.nightsBar}>
            <CalendarDays color={C.lime} size={15} />
            <Text style={styles.nightsText}>
              {nights > 0
                ? `${nights} ${nights === 1 ? 'night' : 'nights'} selected`
                : 'Select your check-in and check-out dates'}
            </Text>
            {nights > 0 && (
              <Text style={styles.nightsReady}>READY</Text>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {rangeEnabled ? 'Select your stay dates' : 'Choose a date'}
                </Text>
                <Text style={styles.calendarHint}>
                  {rangeEnabled
                    ? selectingEnd
                      ? 'Now choose your check-out date.'
                      : 'First choose your check-in date.'
                    : 'Select your preferred booking date.'}
                </Text>
              </View>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.monthHeader}>
              <Pressable
                disabled={previousDisabled}
                onPress={() =>
                  setMonthDate(new Date(year, month - 1, 1, 12))
                }
                style={[styles.monthButton, previousDisabled && styles.disabled]}
              >
                <ChevronLeft
                  color={previousDisabled ? C.border : C.text}
                  size={22}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  setPickerYear(year);
                  setShowMonthYearPicker(current => !current);
                }}
                style={styles.monthTitleButton}
              >
                <Text style={styles.monthTitle}>
                  {monthDate.toLocaleDateString('en-KE', {
                    month: 'long', year: 'numeric',
                  })}
                </Text>
                <ChevronRight
                  color={C.lime}
                  size={16}
                  style={{ transform: [{ rotate: '90deg' }] }}
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  setMonthDate(new Date(year, month + 1, 1, 12))
                }
                style={styles.monthButton}
              >
                <ChevronRight color={C.text} size={22} />
              </Pressable>
            </View>

            {showMonthYearPicker ? (
              <MonthYearGrid
                year={pickerYear}
                selectedMonth={month}
                minimumDate={minimumDate}
                onYearChange={setPickerYear}
                onSelectMonth={selectedMonth => {
                  setMonthDate(new Date(pickerYear, selectedMonth, 1, 12));
                  setShowMonthYearPicker(false);
                }}
              />
            ) : (
            <View style={styles.calendarGrid}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <View key={day} style={styles.dayCell}>
                  <Text style={styles.weekday}>{day}</Text>
                </View>
              ))}

              {cells.map(cell => {
                if (!cell.dateKey) {
                  return <View key={cell.key} style={styles.dayCell} />;
                }

                const isStart = cell.dateKey === checkInDate;
                const isEnd = cell.dateKey === checkOutDate;
                const isBetween =
                  rangeEnabled && !!checkInDate && !!checkOutDate &&
                  cell.dateKey > checkInDate && cell.dateKey < checkOutDate;
                const isPast = cell.dateKey < minimumDate;
                const isSelected = isStart || isEnd;

                return (
                  <View key={cell.key} style={styles.dayCell}>
                    <Pressable
                      disabled={isPast}
                      onPress={() => chooseDate(cell.dateKey)}
                      style={[
                        styles.dayButton,
                        isBetween && styles.rangeMiddleDay,
                        isSelected && styles.selectedDay,
                        isPast && styles.pastDay,
                      ]}
                    >
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isPast && styles.pastDayText,
                      ]}>
                        {cell.day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            )}

            {rangeEnabled && (
              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View style={styles.legendEndpoint} />
                  <Text style={styles.legendText}>Arrival / departure</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.legendRange} />
                  <Text style={styles.legendText}>Your stay</Text>
                </View>
              </View>
            )}

            <Text style={styles.calendarHint}>
              Dates before {displayDate(minimumDate)} are unavailable.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const TIME_OPTIONS = Array.from({ length: 29 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

export function TimePickerField({
  label,
  value,
  onChange,
  minimumTime,
  disabled = false,
}: TimePickerFieldProps) {
  const [visible, setVisible] = useState(false);

  const availableTimes = TIME_OPTIONS.filter(time =>
    !minimumTime || time > minimumTime
  );

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[styles.field, disabled && styles.disabled]}
      >
        <Clock3 color={C.lime} size={20} />
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value || 'Choose preferred time'}
        </Text>
        <ChevronRight color={C.muted} size={19} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a time</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.calendarHint}>
              Select your preferred time. The final appointment is subject to confirmation.
            </Text>

            <ScrollView style={styles.timeList}>
              <View style={styles.timeGrid}>
                {availableTimes.map(time => {
                  const selected = time === value;

                  return (
                    <Pressable
                      key={time}
                      onPress={() => {
                        onChange(time);
                        setVisible(false);
                      }}
                      style={[
                        styles.timeOption,
                        selected && styles.selectedTime,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selected && styles.selectedDayText,
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 20,
  },
  field: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    paddingHorizontal: 15,
  },
  fieldText: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
  },
  placeholder: { color: C.muted, fontWeight: '400' },
  disabled: { opacity: 0.5 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.76)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: C.background,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  close: { color: C.lime, fontWeight: '700' },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
  },
  monthTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  monthTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.card,
  },
  monthYearPanel: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  yearControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  yearText: {
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
  },
  monthChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthChoice: {
    width: '22%',
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthChoiceSelected: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  monthChoiceDisabled: {
    opacity: 0.3,
  },
  monthChoiceText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
  },
  monthChoiceTextSelected: {
    color: C.background,
    fontWeight: '900',
  },
  monthChoiceTextDisabled: {
    color: C.muted,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.2857%',
    height: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekday: { color: C.muted, fontSize: 11, fontWeight: '700' },
  dayButton: {
    width: '100%',
    height: 43,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: { backgroundColor: C.lime },
  pastDay: { opacity: 0.3 },
  dayText: { color: C.text, fontSize: 14, fontWeight: '600' },
  selectedDayText: { color: C.background, fontWeight: '900' },
  pastDayText: { color: C.muted },
  calendarHint: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    marginBottom: 8,
  },
  rangeSection: {
    marginTop: 24, padding: 16, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  rangeHeading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 15,
  },
  rangeTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  rangeSubtitle: { color: C.muted, fontSize: 12, marginTop: 4 },
  rangeFields: { flexDirection: 'row', gap: 10 },
  rangeDateCard: {
    flex: 1, minWidth: 0, minHeight: 96, padding: 12,
    borderRadius: 15, backgroundColor: C.background,
    borderWidth: 1, borderColor: C.border, justifyContent: 'center',
  },
  rangeDateLabel: {
    color: C.lime, fontSize: 10, fontWeight: '900',
    letterSpacing: 1, marginBottom: 8,
  },
  rangeDateValue: { color: C.text, fontSize: 13, fontWeight: '800' },
  rangeDateCaption: { color: C.muted, fontSize: 10, marginTop: 5 },
  nightsBar: {
    minHeight: 39, marginTop: 12, paddingHorizontal: 11,
    borderRadius: 11, backgroundColor: '#20291A',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  nightsText: { color: C.text, fontSize: 11, fontWeight: '700', flex: 1 },
  nightsReady: { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  rangeMiddleDay: { backgroundColor: '#29351B' },
  calendarLegend: {
    flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendEndpoint: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: C.lime,
  },
  legendRange: {
    width: 16, height: 10, borderRadius: 4, backgroundColor: '#29351B',
  },
  legendText: { color: C.muted, fontSize: 10 },
  timeList: { maxHeight: 390 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  timeOption: {
    width: '22%',
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
  },
  selectedTime: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  timeText: { color: C.text, fontSize: 13, fontWeight: '700' },
});
