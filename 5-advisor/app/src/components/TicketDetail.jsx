import React from 'react';

class TicketDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ticket: null, replyDraft: '' };
  }

  componentDidMount() {
    this.loadTicket();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ticketId !== this.props.ticketId) {
      this.loadTicket();
    }
  }

  loadTicket() {
    this.props.client.getTicket(this.props.ticketId).then((ticket) => {
      this.setState({ ticket, replyDraft: '' });
    });
  }

  handleDraftChange = (event) => {
    this.setState({ replyDraft: event.target.value });
  };

  handleSend = () => {
    this.props.client.reply(this.props.ticketId, this.state.replyDraft).then(() => {
      this.setState({ replyDraft: '' });
      this.loadTicket();
    });
  };

  render() {
    const { ticket, replyDraft } = this.state;
    if (!ticket) return <p>Loading...</p>;
    return (
      <div className="ticket-detail">
        <h2>{ticket.subject}</h2>
        <p>{ticket.body}</p>
        <textarea value={replyDraft} onChange={this.handleDraftChange} />
        <button onClick={this.handleSend}>Send reply</button>
      </div>
    );
  }
}

export default TicketDetail;
