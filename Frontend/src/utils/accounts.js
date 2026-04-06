const ACCOUNTS_KEY = "sosal-accounts";

const normalizeUser = (user) => ({ ...user, id: user?._id || user?.id });

export const getStoredAccounts = () => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((a) => a?.token && a?.user?.id).map((a) => ({ ...a, user: normalizeUser(a.user) }));
  } catch {
    return [];
  }
};

export const saveAccountSession = (user, token) => {
  if (!user || !token) return;
  const normalized = normalizeUser(user);
  const uid = normalized.id?.toString();
  if (!uid) return;

  const accounts = getStoredAccounts().filter((a) => a.user.id?.toString() !== uid);
  accounts.unshift({ user: normalized, token });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 10)));
};

export const removeStoredAccount = (userId) => {
  const uid = userId?.toString();
  if (!uid) return;
  const accounts = getStoredAccounts().filter((a) => a.user.id?.toString() !== uid);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const activateStoredAccount = (account) => {
  if (!account?.token || !account?.user) return null;
  const user = normalizeUser(account.user);
  localStorage.setItem("token", account.token);
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};
