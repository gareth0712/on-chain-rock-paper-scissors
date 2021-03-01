const RpsForm = ({ onSubmit, input, setInput, hostOnly, host, player, header, label }) => {
  return (
    <div>
      <form onSubmit={onSubmit}>
        <h4>{header}</h4>
        <div>
          <label>{label}</label>
          <input
            disabled={hostOnly ? host !== player : false}
            value={input}
            onChange={(event) => setInput(event.target.value.replace(/\D/, ''))}
          />
          <label> Gwei</label>
        </div>
        <button disabled={hostOnly ? host !== player : false}>{header}</button>
      </form>
    </div>
  );
};

export default RpsForm;
