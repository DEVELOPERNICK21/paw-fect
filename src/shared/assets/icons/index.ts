import PawIcon from './PawIcon.svg';
import PawsIcon from './PawsIcon.svg';
import SplashPet from './SplashPet.svg';
import GoogleIcon from './googleIcon.svg';
import EditPencil from './EditPencil.svg';
import EditIcon from './EditIcon.svg';
import WeightIcon from './WeightIcon.svg';
import VaccineIcon from './VaccineIcon.svg';
import MaleIcon from './MaleIcon.svg';
import CakeIcon from './CakeIcon.svg';
import FemaleIcon from './femaleIcon.svg';
import SearchIcon from './SearchIcon.svg';
import NoRecordsIcon from './NoRecordsIcon.svg';
import DewormIcon from './dewormIcon.svg';

export const icons = {
  paw: PawIcon,
  paws: PawsIcon,
  splashPet: SplashPet,
  google: GoogleIcon,
  editPencil: EditPencil,
  editIcon: EditIcon,
  weightIcon: WeightIcon,
  vaccineIcon: VaccineIcon,
  maleIcon: MaleIcon,
  cakeIcon: CakeIcon,
  femaleIcon: FemaleIcon,
  searchIcon: SearchIcon,
  noRecordsIcon: NoRecordsIcon,
  dewormIcon: DewormIcon,
} as const;

export type AppSvgIconName = keyof typeof icons;
