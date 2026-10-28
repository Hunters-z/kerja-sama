export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      bg:'#F4F6FA', card:'#FFFFFF', card2:'#F1F3F8', line:'#E6E9F0',
      ink:'#10131A', inksoft:'#5C6470', dim:'#9AA1AD',
      blue:{DEFAULT:'#2563EB',dark:'#1D4ED8',soft:'#EAF0FE'},
      green:{DEFAULT:'#16A34A',soft:'#E8F7EE'},
      gold:{DEFAULT:'#D97706',soft:'#FEF3E2'},
      amber:{DEFAULT:'#D97706',soft:'#FEF3E2'},
      red:{DEFAULT:'#DC2626',soft:'#FDECEC'},
      violet:{DEFAULT:'#7C3AED',soft:'#F1EBFE'},
    },
    fontFamily: { disp:['Sora','sans-serif'], body:['"Plus Jakarta Sans"','sans-serif'] },
    boxShadow: { soft:'0 2px 12px rgba(16,19,26,.06)', pop:'0 10px 30px rgba(37,99,235,.18)' },
  } },
  plugins: []
}
