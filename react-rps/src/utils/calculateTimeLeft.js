const getCurrentTime = () => Math.floor(Date.now() / 1000);

const calculateTimeLeft = (fomoEndTime) => {
  if (fomoEndTime === 0) return 0;
  let difference = fomoEndTime - getCurrentTime();
  let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

  if (difference > 0) {
    timeLeft.hours = Math.floor((difference / (60 * 60)) % 24);
    timeLeft.minutes = Math.floor((difference / 60) % 60);
    timeLeft.seconds = Math.floor(difference % 60);
  }
  return timeLeft;
};

export default calculateTimeLeft;
