"""Add EPS table with Colombian EPS data

Revision ID: eps_table_001
Revises: medical_mgmt_001
Create Date: 2025-01-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision = 'eps_table_001'
down_revision = 'medical_mgmt_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create EPS table
    op.create_table('eps',
        sa.Column('id', sa.String(36), nullable=False, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False, unique=True),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('regime_type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, default='activa'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now())
    )
    
    # Create indexes
    op.create_index('ix_eps_regime_type', 'eps', ['regime_type'])
    op.create_index('ix_eps_status', 'eps', ['status'])
    
    # Insert initial EPS data
    eps_table = table('eps',
        column('id', sa.String),
        column('name', sa.String),
        column('code', sa.String),
        column('regime_type', sa.String),
        column('status', sa.String)
    )
    
    import uuid
    
    # EPS data from official Colombian Ministry of Health list 2025
    eps_data = [
        # EPS que operan en ambos regímenes
        {'name': 'Coosalud EPS', 'code': 'COOSALUD', 'regime_type': 'ambos'},
        {'name': 'Nueva EPS', 'code': 'NUEVA_EPS', 'regime_type': 'ambos'},
        {'name': 'Mutual Ser EPS', 'code': 'MUTUAL_SER', 'regime_type': 'ambos'},
        {'name': 'Salud Mía EPS', 'code': 'SALUD_MIA', 'regime_type': 'ambos'},
        
        # EPS solo régimen contributivo
        {'name': 'Aliansalud EPS', 'code': 'ALIANSALUD', 'regime_type': 'contributivo'},
        {'name': 'Salud Total EPS', 'code': 'SALUD_TOTAL', 'regime_type': 'contributivo'},
        {'name': 'Sanitas EPS', 'code': 'SANITAS', 'regime_type': 'contributivo'},
        {'name': 'Sura EPS', 'code': 'SURA', 'regime_type': 'contributivo'},
        {'name': 'Famisanar EPS', 'code': 'FAMISANAR', 'regime_type': 'contributivo'},
        {'name': 'SOS (Servicio Occidental de Salud) EPS', 'code': 'SOS', 'regime_type': 'contributivo'},
        {'name': 'Comfenalco Valle EPS', 'code': 'COMFENALCO_VALLE', 'regime_type': 'contributivo'},
        {'name': 'Compensar EPS', 'code': 'COMPENSAR', 'regime_type': 'contributivo'},
        {'name': 'EPM (Empresas Públicas de Medellín) EPS', 'code': 'EPM', 'regime_type': 'contributivo'},
        {'name': 'Fondo de Pasivo Social de Ferrocarriles Nacionales', 'code': 'FPS_FERROCARRILES', 'regime_type': 'contributivo'},
        
        # EPS solo régimen subsidiado
        {'name': 'Cajacopi Atlántico EPS', 'code': 'CAJACOPI_ATLANTICO', 'regime_type': 'subsidiado'},
        {'name': 'Capresoca EPS', 'code': 'CAPRESOCA', 'regime_type': 'subsidiado'},
        {'name': 'Comfachocó EPS', 'code': 'COMFACHOCO', 'regime_type': 'subsidiado'},
        {'name': 'Comfaoriente EPS', 'code': 'COMFAORIENTE', 'regime_type': 'subsidiado'},
        {'name': 'EPS Familiar de Colombia', 'code': 'EPS_FAMILIAR', 'regime_type': 'subsidiado'},
        {'name': 'Asmet Salud EPS', 'code': 'ASMET_SALUD', 'regime_type': 'subsidiado'},
        {'name': 'Emssanar EPS', 'code': 'EMSSANAR', 'regime_type': 'subsidiado'},
        {'name': 'Capital Salud EPS', 'code': 'CAPITAL_SALUD', 'regime_type': 'subsidiado'},
        {'name': 'Savia Salud EPS', 'code': 'SAVIA_SALUD', 'regime_type': 'subsidiado'},
        {'name': 'Dusakawi EPSI', 'code': 'DUSAKAWI', 'regime_type': 'subsidiado'},
        {'name': 'Asociación Indígena del Cauca EPSI', 'code': 'AIC_EPSI', 'regime_type': 'subsidiado'},
        {'name': 'Anas Wayuu EPSI', 'code': 'ANAS_WAYUU', 'regime_type': 'subsidiado'},
        {'name': 'Mallamas EPSI', 'code': 'MALLAMAS', 'regime_type': 'subsidiado'},
        {'name': 'Pijaos Salud EPSI', 'code': 'PIJAOS_SALUD', 'regime_type': 'subsidiado'}
    ]
    
    # Insert data with generated UUIDs
    for eps in eps_data:
        op.bulk_insert(eps_table, [{
            'id': str(uuid.uuid4()),
            'name': eps['name'],
            'code': eps['code'],
            'regime_type': eps['regime_type'],
            'status': 'activa'
        }])


def downgrade() -> None:
    op.drop_index('ix_eps_status', table_name='eps')
    op.drop_index('ix_eps_regime_type', table_name='eps')
    op.drop_table('eps')