export function calculateTeamPoints({
  kills,
  position,
  killPoints,
  positionPoints,
}) {
  let points = kills * killPoints;

  if (position && positionPoints[position]) {
    points += positionPoints[position];
  }

  return points;
}
