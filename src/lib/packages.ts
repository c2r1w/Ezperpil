// Utility function to fetch business packages from MongoDB
export const fetchBusinessPackages = async () => {
  try {
    const res = await fetch('/api/business-packages');
    if (!res.ok) throw new Error('Failed to fetch packages');
    const result = await res.json();
    if (result.success && Array.isArray(result.packages)) {
      return result.packages;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Could not fetch packages from DB', error);
    return [];
  }
};

export const getPackageById = (packages: any[], packageId: string) => {
  return packages.find(p => (p._id || p.id) === packageId);
};
