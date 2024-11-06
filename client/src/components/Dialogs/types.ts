import { Profile, ProfileDialog } from '../../types'

export interface DialogType extends ProfileDialog {
    profile: Pick<Profile, 'id' | 'name'>
}
