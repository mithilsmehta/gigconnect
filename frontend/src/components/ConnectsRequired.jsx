import { useNavigate } from 'react-router-dom';

export default function ConnectsRequired({ connectsNeeded = 2, currentConnects = 0 }) {
    const navigate = useNavigate();

    return (
        <div className="alert alert-warning" role="alert">
            <div className="d-flex align-items-center mb-3">
                <div style={{ fontSize: '2rem', marginRight: '1rem' }}>⚡</div>
                <div>
                    <h5 className="alert-heading mb-1">Insufficient Connects</h5>
                    <p className="mb-0">
                        You need <strong>{connectsNeeded} connects</strong> to apply to this job, but you only have{' '}
                        <strong>{currentConnects} connects</strong>.
                    </p>
                </div>
            </div>

            <hr />

            <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                    💡 Connects let you apply to jobs. Buy more to continue applying!
                </small>
                <button
                    className="btn btn-success"
                    onClick={() => navigate('/buy-connects')}
                    style={{ borderRadius: 20 }}
                >
                    Buy Connects
                </button>
            </div>
        </div>
    );
}
