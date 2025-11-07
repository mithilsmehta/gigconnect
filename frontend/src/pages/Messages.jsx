export default function Messages() {
    return (
        <div className="container py-4">
            <h3 className="mb-3">Messages</h3>
            <div className="row g-3">
                <div className="col-md-4">
                    <div className="list-group shadow-sm">
                        <button className="list-group-item list-group-item-action active">Rushi T.</button>
                        <button className="list-group-item list-group-item-action">Mithil M.</button>
                    </div>
                </div>
                <div className="col-md-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-body d-flex flex-column">
                            <div className="flex-grow-1">
                                <div className="text-muted small">Today</div>
                                <div className="p-2 bg-body-secondary rounded-3 d-inline-block my-1">Hello! Let’s discuss the job.</div>
                            </div>
                            <form className="d-flex gap-2 pt-2 border-top">
                                <input className="form-control" placeholder="Type a message…" />
                                <button className="btn btn-success" type="button">Send</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}