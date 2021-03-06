function CheckForSep(param, sep) {
  const lastChar = param.substr(-1);
  if (lastChar != sep) {
    return true;
  }
  return false;
}

module.exports = {
  loop: (n) => (f) => {
    const iter = (i) => {
      if (i === n) { return; }
      f(i);
      iter(i + 1);
    };
    return iter(0);
  },
  addTrailingSep: function(param, sep) {
    if (CheckForSep(param, sep)) {
      return param + sep;
    }
    return param;
  }
};
