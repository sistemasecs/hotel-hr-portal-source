import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query("SELECT key, value FROM hotel_config WHERE key IN ('hotel_logo', 'event_types', 'hotel_latitude', 'hotel_longitude', 'hotel_geofence_radius', 'clock_in_window_minutes', 'working_days', 'hotel_timezone', 'tier_agreement_1', 'tier_agreement_2', 'tier_agreement_3', 'value_chain', 'comm_protocols', 'glossary', 'value_chain_goal', 'value_chain_value', 'training_tiers')");

        const config: Record<string, any> = {
            hotelLogo: null,
            eventTypes: null,
            hotelLatitude: null,
            hotelLongitude: null,
            hotelGeofenceRadius: null,
            clockInWindowMinutes: null,
            workingDays: [1, 2, 3, 4, 5], // Default Mon-Fri
            hotelTimezone: 'America/Guatemala',
            tierAgreement1: null,
            tierAgreement2: null,
            tierAgreement3: null,
            valueChain: null,
            commProtocols: null,
            glossary: null,
            valueChainGoal: null,
            valueChainValue: null,
            trainingTiers: null
        };

        result.rows.forEach(row => {
            if (row.key === 'hotel_logo') config.hotelLogo = row.value;
            if (row.key === 'event_types') {
                try {
                    config.eventTypes = JSON.parse(row.value);
                } catch (e) {
                    config.eventTypes = row.value;
                }
            }
            if (row.key === 'hotel_latitude') config.hotelLatitude = parseFloat(row.value);
            if (row.key === 'hotel_longitude') config.hotelLongitude = parseFloat(row.value);
            if (row.key === 'hotel_geofence_radius') config.hotelGeofenceRadius = parseInt(row.value);
            if (row.key === 'clock_in_window_minutes') config.clockInWindowMinutes = parseInt(row.value);
            if (row.key === 'working_days') {
                try {
                    config.workingDays = JSON.parse(row.value);
                } catch (e) {
                    config.workingDays = [1, 2, 3, 4, 5];
                }
            }
            if (row.key === 'hotel_timezone') config.hotelTimezone = row.value;
            if (row.key === 'tier_agreement_1') config.tierAgreement1 = row.value;
            if (row.key === 'tier_agreement_2') config.tierAgreement2 = row.value;
            if (row.key === 'tier_agreement_3') config.tierAgreement3 = row.value;
            if (row.key === 'value_chain') {
                try { config.valueChain = JSON.parse(row.value); } catch (e) { config.valueChain = row.value; }
            }
            if (row.key === 'comm_protocols') {
                try { config.commProtocols = JSON.parse(row.value); } catch (e) { config.commProtocols = row.value; }
            }
            if (row.key === 'glossary') {
                try { config.glossary = JSON.parse(row.value); } catch (e) { config.glossary = row.value; }
            }
            if (row.key === 'value_chain_goal') config.valueChainGoal = row.value;
            if (row.key === 'value_chain_value') config.valueChainValue = row.value;
            if (row.key === 'training_tiers') {
                try { config.trainingTiers = JSON.parse(row.value); } catch (e) { config.trainingTiers = row.value; }
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching hotel config:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            hotelLogo, eventTypes, hotelLatitude, hotelLongitude, 
            hotelGeofenceRadius, clockInWindowMinutes, workingDays, 
            hotelTimezone, tierAgreement1, tierAgreement2, tierAgreement3,
            valueChain, commProtocols, glossary,
            valueChainGoal, valueChainValue, trainingTiers
        } = body;

        if (hotelLogo !== undefined) {
            if (hotelLogo === null) {
                await pool.query("DELETE FROM hotel_config WHERE key = 'hotel_logo'");
            } else {
                await pool.query(
                    "INSERT INTO hotel_config (key, value) VALUES ('hotel_logo', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                    [hotelLogo]
                );
            }
        }

        if (eventTypes !== undefined) {
            if (eventTypes === null) {
                await pool.query("DELETE FROM hotel_config WHERE key = 'event_types'");
            } else {
                const eventTypesStr = typeof eventTypes === 'string' ? eventTypes : JSON.stringify(eventTypes);
                await pool.query(
                    "INSERT INTO hotel_config (key, value) VALUES ('event_types', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                    [eventTypesStr]
                );
            }
        }

        if (hotelLatitude !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_latitude', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelLatitude.toString()]
            );
        }

        if (hotelLongitude !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_longitude', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelLongitude.toString()]
            );
        }

        if (hotelGeofenceRadius !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_geofence_radius', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelGeofenceRadius.toString()]
            );
        }

        if (clockInWindowMinutes !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('clock_in_window_minutes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [clockInWindowMinutes.toString()]
            );
        }
        if (workingDays !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('working_days', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [JSON.stringify(workingDays)]
            );
        }
        if (hotelTimezone !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_timezone', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelTimezone]
            );
        }

        if (tierAgreement1 !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('tier_agreement_1', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [tierAgreement1]
            );
        }

        if (tierAgreement2 !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('tier_agreement_2', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [tierAgreement2]
            );
        }

        if (tierAgreement3 !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('tier_agreement_3', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [tierAgreement3]
            );
        }

        if (valueChain !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('value_chain', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [typeof valueChain === 'string' ? valueChain : JSON.stringify(valueChain)]
            );
        }

        if (commProtocols !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('comm_protocols', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [typeof commProtocols === 'string' ? commProtocols : JSON.stringify(commProtocols)]
            );
        }

        if (glossary !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('glossary', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [typeof glossary === 'string' ? glossary : JSON.stringify(glossary)]
            );
        }

        if (valueChainGoal !== undefined) {
            await pool.query("INSERT INTO hotel_config (key, value) VALUES ('value_chain_goal', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [valueChainGoal]);
        }

        if (valueChainValue !== undefined) {
            await pool.query("INSERT INTO hotel_config (key, value) VALUES ('value_chain_value', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [valueChainValue]);
        }

        if (trainingTiers !== undefined) {
            await pool.query("INSERT INTO hotel_config (key, value) VALUES ('training_tiers', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [JSON.stringify(trainingTiers)]);
        }
        
        return NextResponse.json({ success: true, hotelLogo, eventTypes, hotelLatitude, hotelLongitude, hotelGeofenceRadius, clockInWindowMinutes, workingDays });
    } catch (error) {
        console.error('Error updating hotel config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
