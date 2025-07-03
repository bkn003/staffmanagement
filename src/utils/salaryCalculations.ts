import { Staff, Attendance, SalaryDetail, AdvanceDeduction, PartTimeStaff, PartTimeSalaryDetail } from '../types';

// Round to nearest 10
export const roundToNearest10 = (value: number): number => {
  return Math.round(value / 10) * 10;
};

// Check if date is Sunday
export const isSunday = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date.getDay() === 0;
};

// Get days in month
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Calculate attendance values
export const calculateAttendanceMetrics = (
  staffId: string,
  attendance: Attendance[],
  year: number,
  month: number
) => {
  const monthlyAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    return record.staffId === staffId && 
           recordDate.getMonth() === month && 
           recordDate.getFullYear() === year &&
           !record.isPartTime; // Only full-time staff
  });

  const presentDays = monthlyAttendance
    .filter(record => record.status === 'Present')
    .reduce((sum, record) => sum + (record.attendanceValue || 1), 0);

  const halfDays = monthlyAttendance
    .filter(record => record.status === 'Half Day')
    .reduce((sum, record) => sum + (record.attendanceValue || 0.5), 0);

  const totalPresentDays = presentDays + halfDays;

  const sundayAbsents = monthlyAttendance
    .filter(record => record.status === 'Absent' && isSunday(record.date))
    .length;

  const daysInMonth = getDaysInMonth(year, month);
  const leaveDays = daysInMonth - Math.floor(totalPresentDays);

  return {
    presentDays: Math.floor(presentDays),
    halfDays: Math.floor(halfDays * 2), // Convert 0.5 to count
    totalPresentDays,
    leaveDays,
    sundayAbsents,
    daysInMonth
  };
};

// Calculate part-time salary
export const calculatePartTimeSalary = (
  staffName: string,
  location: string,
  attendance: Attendance[],
  year: number,
  month: number,
  ratePerDay: number = 800,
  ratePerShift: number = 400
): PartTimeSalaryDetail => {
  const monthlyAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    return record.staffName === staffName && 
           recordDate.getMonth() === month && 
           recordDate.getFullYear() === year &&
           record.isPartTime &&
           record.status === 'Present';
  });

  let totalDays = 0;
  let totalShifts = 0;

  monthlyAttendance.forEach(record => {
    if (record.shift === 'Both') {
      totalDays += 1;
      totalShifts += 2;
    } else if (record.shift === 'Morning' || record.shift === 'Evening') {
      totalShifts += 1;
    }
  });

  const totalEarnings = roundToNearest10((totalDays * ratePerDay) + (totalShifts * ratePerShift));

  return {
    staffName,
    location,
    totalDays,
    totalShifts,
    ratePerDay,
    ratePerShift,
    totalEarnings,
    month,
    year
  };
};

// Get previous month's advance data for carry-forward
export const getPreviousMonthAdvance = (
  staffId: string,
  advances: AdvanceDeduction[],
  currentMonth: number,
  currentYear: number
): number => {
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = currentYear - 1;
  }

  const previousAdvance = advances.find(adv => 
    adv.staffId === staffId && 
    adv.month === prevMonth && 
    adv.year === prevYear
  );

  return previousAdvance?.newAdvance || 0;
};

// Calculate salary based on attendance
export const calculateSalary = (
  staff: Staff,
  attendanceMetrics: ReturnType<typeof calculateAttendanceMetrics>,
  advances: AdvanceDeduction | null,
  allAdvances: AdvanceDeduction[],
  currentMonth: number,
  currentYear: number
): SalaryDetail => {
  const { totalPresentDays, sundayAbsents, daysInMonth, presentDays, halfDays, leaveDays } = attendanceMetrics;
  
  let basicEarned: number;
  let incentiveEarned: number;
  let hraEarned: number;

  // Base salary calculation logic
  if (totalPresentDays === 26) {
    // Full month present
    basicEarned = staff.basicSalary;
    incentiveEarned = staff.incentive;
    hraEarned = staff.hra;
  } else if (totalPresentDays >= 25) {
    // Near full month (25-26 days)
    basicEarned = roundToNearest10((staff.basicSalary / 26) * totalPresentDays);
    incentiveEarned = staff.incentive;
    hraEarned = staff.hra;
  } else {
    // Less than 25 days - pro-rated calculation
    basicEarned = roundToNearest10((staff.basicSalary / 26) * totalPresentDays);
    incentiveEarned = roundToNearest10((staff.incentive / 26) * totalPresentDays);
    // HRA calculation: reduce pro-rata then add full HRA back
    const reducedHRA = roundToNearest10((staff.hra / 26) * totalPresentDays);
    hraEarned = staff.hra; // Full HRA is added back
  }

  // Calculate Sunday penalty
  let sundayPenalty = 0;
  let adjustedIncentive = incentiveEarned;

  if (sundayAbsents > 0) {
    const totalPenalty = sundayAbsents * 500;
    
    if (adjustedIncentive >= totalPenalty) {
      adjustedIncentive -= totalPenalty;
      sundayPenalty = totalPenalty;
    } else {
      sundayPenalty = adjustedIncentive;
      adjustedIncentive = 0;
    }
  }

  // Gross salary calculation
  const grossSalary = roundToNearest10(basicEarned + adjustedIncentive + hraEarned);

  // Advance and deduction handling with carry-forward
  const oldAdv = advances?.oldAdvance || getPreviousMonthAdvance(staff.id, allAdvances, currentMonth, currentYear);
  const curAdv = advances?.currentAdvance || 0;
  const deduction = advances?.deduction || 0;

  // Calculate new advance
  const newAdv = roundToNearest10(oldAdv + curAdv - deduction);

  // Calculate net salary
  const netSalary = Math.max(0, roundToNearest10(grossSalary - curAdv - deduction));

  return {
    staffId: staff.id,
    month: currentMonth,
    year: currentYear,
    presentDays,
    halfDays,
    leaveDays,
    sundayAbsents,
    oldAdv: roundToNearest10(oldAdv),
    curAdv: roundToNearest10(curAdv),
    deduction: roundToNearest10(deduction),
    basicEarned: roundToNearest10(basicEarned),
    incentiveEarned: roundToNearest10(adjustedIncentive),
    hraEarned: roundToNearest10(hraEarned),
    sundayPenalty: roundToNearest10(sundayPenalty),
    grossSalary,
    newAdv,
    netSalary,
    isProcessed: false
  };
};

// Calculate dashboard attendance with half-day support and part-time staff
export const calculateLocationAttendance = (
  staff: Staff[],
  attendance: Attendance[],
  date: string,
  location: string
) => {
  const locationStaff = staff.filter(member => member.location === location && member.isActive);
  const locationAttendance = attendance.filter(record => {
    if (record.isPartTime) {
      // For part-time staff, check by location in attendance record
      return record.date === date && 
             attendance.find(a => a.id === record.id && a.staffName)?.location === location;
    } else {
      // For full-time staff, check by staff member location
      const staffMember = staff.find(s => s.id === record.staffId);
      return staffMember?.location === location && record.date === date && !record.isPartTime;
    }
  });

  // Get part-time attendance for this location and date
  const partTimeAttendance = attendance.filter(record => 
    record.isPartTime && record.date === date && record.status === 'Present'
  );

  const present = locationAttendance.filter(record => record.status === 'Present');
  const halfDay = locationAttendance.filter(record => record.status === 'Half Day');
  const absent = locationAttendance.filter(record => record.status === 'Absent');

  // Calculate total present days including half days
  const totalPresentValue = present.length + (halfDay.length * 0.5);

  // Get names for display
  const presentNames = present.map(p => {
    if (p.isPartTime) {
      return `${p.staffName} (${p.shift})`;
    } else {
      return staff.find(s => s.id === p.staffId)?.name;
    }
  }).filter(Boolean);

  const halfDayNames = halfDay.map(h => {
    if (h.isPartTime) {
      return `${h.staffName} (${h.shift})`;
    } else {
      return staff.find(s => s.id === h.staffId)?.name;
    }
  }).filter(Boolean);

  const absentNames = absent.map(a => {
    if (a.isPartTime) {
      return `${a.staffName} (${a.shift})`;
    } else {
      return staff.find(s => s.id === a.staffId)?.name;
    }
  }).filter(Boolean);

  return {
    total: locationStaff.length,
    present: present.length,
    halfDay: halfDay.length,
    absent: absent.length,
    totalPresentValue: Math.round(totalPresentValue * 10) / 10,
    presentNames,
    halfDayNames,
    absentNames
  };
};