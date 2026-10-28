export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      paper:'#F0F4F8', ink:'#0F172A', inksoft:'#64748B', line:'#E2E8F0',
      blue:{DEFAULT:'#2563EB',dark:'#1D4ED8',soft:'#DBEAFE'},
      green:{DEFAULT:'#10B981',soft:'#D1FAE5'},
      amber:{DEFAULT:'#F59E0B',soft:'#FEF3C7'},
      red:{DEFAULT:'#EF4444',soft:'#FEE2E2'},
      violet:{DEFAULT:'#8B5CF6',soft:'#EDE9FE'},
    },
    fontFamily: { disp:['Sora','sans-serif'], body:['"Plus Jakarta Sans"','sans-serif'] },
    boxShadow: { soft:'0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.06)' },
  } },
  plugins: []
}