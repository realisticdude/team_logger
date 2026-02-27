// test.js
fetch("https://jsnulpbadftqhmukslbr.supabase.co")
  .then(res => console.log("OK", res.status))
  .catch(err => console.error("FAIL", err));