module.exports = {
  all: false,
  include: ["contracts/"],
  exclude: ["contracts/interfaces/"],
  skipFiles: [],
  solcOptimizerDetails: {
    enabled: true,
    runs: 800,
  },
};
