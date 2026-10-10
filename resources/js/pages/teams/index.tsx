import { Head, Link } from '@inertiajs/react';
import { Eye, LogOut, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import CreateTeamModal from '@/components/create-team-modal';
import Heading from '@/components/heading';
import LeaveTeamModal from '@/components/leave-team-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { edit, index } from '@/routes/teams';
import type { Team } from '@/types';

type Props = {
    teams: Team[];
};

export default function TeamsIndex({ teams }: Props) {
    const [leaveTeamDialogOpen, setLeaveTeamDialogOpen] = useState(false);
    const [teamLeaving, setTeamLeaving] = useState<Team | null>(null);

    const openLeaveTeamDialog = (team: Team) => {
        setTeamLeaving(team);
        setLeaveTeamDialogOpen(true);
    };

    return (
        <>
            <Head title="Tim" />

            <h1 className="sr-only">Tim</h1>

            <div className="account-list">
                <div className="account-section-header">
                    <Heading
                        variant="small"
                        title="Tim"
                        description="Kelola tim dan keanggotaan tim kamu"
                    />

                    <CreateTeamModal>
                        <Button data-test="teams-new-team-button">
                            <Plus /> Tim baru
                        </Button>
                    </CreateTeamModal>
                </div>

                <div className="account-list-items">
                    {teams.map((team) => {
                        const canLeaveTeam =
                            !team.isPersonal && team.role !== 'owner';

                        return (
                            <div
                                key={team.id}
                                data-test="team-row"
                                className="account-card"
                            >
                                <div className="account-card-main">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="account-card-title">
                                                {team.name}
                                            </span>
                                            {team.isPersonal ? (
                                                <Badge variant="secondary">
                                                    Personal
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <span className="account-meta">
                                            {team.roleLabel}
                                        </span>
                                    </div>
                                </div>

                                <TooltipProvider>
                                    <div className="flex items-center gap-2">
                                        {canLeaveTeam ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="team-leave-button"
                                                        onClick={() =>
                                                            openLeaveTeamDialog(
                                                                team,
                                                            )
                                                        }
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Keluar dari tim</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : null}

                                        {team.role === 'member' ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="team-view-button"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={edit(
                                                                team.slug,
                                                            )}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Lihat tim</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="team-edit-button"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={edit(
                                                                team.slug,
                                                            )}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit tim</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </TooltipProvider>
                            </div>
                        );
                    })}

                    {teams.length === 0 ? (
                        <p className="account-empty">
                            Kamu belum tergabung dalam tim mana pun.
                        </p>
                    ) : null}
                </div>
            </div>

            <LeaveTeamModal
                team={teamLeaving}
                open={leaveTeamDialogOpen}
                onOpenChange={setLeaveTeamDialogOpen}
            />
        </>
    );
}

TeamsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tim',
            href: index(),
        },
    ],
};
