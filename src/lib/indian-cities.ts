// Top 150 Indian cities by population — covers ~95% of urban users
export const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune",
  "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Visakhapatnam", "Indore", "Thane", "Bhopal",
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
  "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai",
  "Allahabad", "Howrah", "Ranchi", "Gwalior", "Jabalpur", "Coimbatore", "Vijayawada",
  "Jodhpur", "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli",
  "Tiruchirappalli", "Bareilly", "Mysuru", "Tiruppur", "Gurgaon", "Aligarh", "Jalandhar",
  "Bhubaneswar", "Salem", "Warangal", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur",
  "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad",
  "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela",
  "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni",
  "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", "Sangli", "Mangalore", "Erode",
  "Belgaum", "Kurnool", "Ambattur", "Rajahmundry", "Tirunelveli", "Malegaon",
  "Gaya", "Udaipur", "Kakinada", "Davanagere", "Kozhikode", "Maheshtala",
  "Rajpur Sonarpur", "Bokaro", "South Dumdum", "Bellary", "Patiala", "Gopalpur",
  "Agartala", "Bhagalpur", "Muzaffarnagar", "Bhatpara", "Panihati", "Latur",
  "Dhule", "Rohtak", "Korba", "Bhilwara", "Berhampur", "Muzaffarpur", "Ahmednagar",
  "Mathura", "Kollam", "Avadi", "Kadapa", "Anantapur", "Kamarhati", "Bilaspur",
  "Sambalpur", "Shahjahanpur", "Satara", "Bijapur", "Rampur", "Shimoga", "Chandrapur",
  "Junagadh", "Thrissur", "Alwar", "Bardhaman", "Kulti", "Nizamabad", "Parbhani",
  "Tumkur", "Khammam", "Ozhukarai", "Bihar Sharif", "Panipat", "Darbhanga",
  "Bally", "Aizawl", "Dewas", "Ichalkaranji", "Karnal", "Bathinda", "Jalna",
  "Eluru", "Kirari Suleman Nagar", "Barasat",
  // Common alternate names
  "Vizag", "Bangalore", "Calcutta", "Bombay", "Madras", "Trivandrum", "Pondicherry",
  "Cochin", "Calicut", "Mangaluru", "Mysore", "Shimla", "Ooty", "Darjeeling",
];

export function searchCities(query: string): string[] {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  return INDIAN_CITIES.filter((c) => c.toLowerCase().startsWith(lower)).slice(0, 8);
}
