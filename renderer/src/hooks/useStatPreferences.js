import { useState } from 'react';

// Small UI-only preferences for the stat row — persisted so they survive a restart,
// but never touch the tracked data itself (tax/basis are display transforms only).
export function useStatPreferences() {
  const [taxOn, setTaxOn] = useState(() => localStorage.getItem('tli.taxOn') === 'true');
  const [feBasis, setFeBasis] = useState(() => localStorage.getItem('tli.feBasis') || 'active');
  const [feGoal, setFeGoal] = useState(() => Number(localStorage.getItem('tli.feGoal')) || 5000);
  const [alertThreshold, setAlertThreshold] = useState(() => Number(localStorage.getItem('tli.alertThreshold')) || 50);
  const [alertsOn, setAlertsOn] = useState(() => localStorage.getItem('tli.alertsOn') !== 'false');

  const toggleTax = () => {
    setTaxOn((prev) => {
      const next = !prev;
      localStorage.setItem('tli.taxOn', String(next));
      return next;
    });
  };

  const changeFeBasis = (basis) => {
    setFeBasis(basis);
    localStorage.setItem('tli.feBasis', basis);
  };

  const changeFeGoal = (goal) => {
    const next = Math.max(1, Number(goal) || 1);
    setFeGoal(next);
    localStorage.setItem('tli.feGoal', String(next));
  };

  const changeAlertThreshold = (value) => {
    const next = Math.max(1, Number(value) || 1);
    setAlertThreshold(next);
    localStorage.setItem('tli.alertThreshold', String(next));
  };

  const toggleAlerts = () => {
    setAlertsOn((prev) => {
      const next = !prev;
      localStorage.setItem('tli.alertsOn', String(next));
      return next;
    });
  };

  return {
    taxOn,
    toggleTax,
    feBasis,
    changeFeBasis,
    feGoal,
    changeFeGoal,
    alertThreshold,
    changeAlertThreshold,
    alertsOn,
    toggleAlerts,
  };
}
